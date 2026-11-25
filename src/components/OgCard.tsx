import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { caseStudySlugs, getProject, type Media, type Project } from "@/content/projects";
import { site } from "@/content/site";

// Share cards. Link previews use them through opengraph-image.tsx files (the home preview is a room
// render, app/opengraph-image.jpg instead), and `pnpm cards` saves the rest as PNGs to upload by
// hand. Satori renders these, so every element with more than one child needs display: flex, and
// colors are hex values copied from styles/tokens.css.

type Size = { width: number; height: number };

export const ogSize: Size = { width: 1200, height: 630 };
/** GitHub's repo social preview. */
const githubSize: Size = { width: 1280, height: 640 };
/** LinkedIn's profile banner. */
const bannerSize: Size = { width: 1584, height: 396 };

const c = {
  paper: "#f5f5f7",
  card: "#ffffff",
  ink: "#1d1d1f",
  muted: "#5f5f66",
  rule: "rgba(29, 29, 31, 0.12)",
  scarlet: "#ff3b1f",
};

const sans = "Inter";
const mono = "Geist Mono";

/** A static TTF from Google Fonts (it serves TTF to non-browser clients), or null if the fetch fails. */
async function googleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  "use cache";
  cacheLife("max");
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@${weight}`).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** The site's fonts. A font that fails to load drops out, and Satori falls back to its bundled sans. */
async function fonts() {
  const wanted = [
    { name: sans, weight: 400 },
    { name: sans, weight: 600 },
    { name: mono, weight: 500 },
  ] as const;
  const loaded = await Promise.all(wanted.map((f) => googleFont(f.name, f.weight)));
  return wanted.flatMap((f, i) => {
    const data = loaded[i];
    return data ? [{ ...f, data, style: "normal" as const }] : [];
  });
}

/** The cover as a data URI when it is a raster file in public/. Satori can't play video or read webp. */
async function coverData(cover: Media): Promise<string | null> {
  "use cache";
  cacheLife("max");
  const src = cover.kind === "video" ? cover.videoPoster : cover.src;
  const type = src?.match(/\.(png|jpe?g)$/i)?.[1].toLowerCase();
  if (!src || !type) return null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", src));
    return `data:image/${type === "png" ? "png" : "jpeg"};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

async function render(children: ReactNode, size: Size, padding = "64px 72px") {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: c.paper,
          color: c.ink,
          fontFamily: sans,
          padding,
        }}
      >
        {children}
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}

function Label({ children, color = c.muted, size = 26 }: { children: ReactNode; color?: string; size?: number }) {
  return <div style={{ display: "flex", fontFamily: mono, fontWeight: 500, fontSize: size, color, letterSpacing: -0.3 }}>{children}</div>;
}

function Name({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", fontSize: size, fontWeight: 600, letterSpacing: size * -0.042, lineHeight: 1 }}>
      {site.name}
      <span style={{ color: c.scarlet }}>.</span>
    </div>
  );
}

/** The lede with the typing tagline's caret after it. */
function Lede({ size }: { size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size / 3 }}>
      <div style={{ display: "flex", fontSize: size, fontWeight: 400, letterSpacing: size * -0.024 }}>{site.lede.highlight}</div>
      <div style={{ display: "flex", width: Math.max(3, size / 10), height: size * 1.1, background: c.scarlet }} />
    </div>
  );
}

const metaLine = () => [site.role, site.city, site.availability].join(" · ").toLowerCase();

/** The hero as a card: name, meta line and lede. `label` sits at the top. */
export async function siteCard({ label = site.brand, size = ogSize }: { label?: string; size?: Size } = {}) {
  return render(
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
      <Label>{label}</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Name size={120} />
        <Label>{metaLine()}</Label>
      </div>
      <div style={{ display: "flex", borderTop: `2px solid ${c.rule}`, paddingTop: 32 }}>
        <Lede size={42} />
      </div>
    </div>,
    size,
  );
}

/** LinkedIn banner. The profile photo covers the bottom-left, so everything sits on the right. */
async function bannerCard() {
  return render(
    <div style={{ display: "flex", width: "100%", justifyContent: "flex-end", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Name size={84} />
        <Label size={22}>{metaLine()}</Label>
        <div style={{ display: "flex", borderTop: `2px solid ${c.rule}`, paddingTop: 20, marginTop: 6 }}>
          <Lede size={30} />
        </div>
      </div>
    </div>,
    bannerSize,
    "48px 88px",
  );
}

/** Case study card: area, headline and project name, with the cover on the right when there is one. */
export async function caseStudyCard(project: Project, size = ogSize) {
  const cover = await coverData(project.cover);
  const title = project.caseStudy.title;
  const titleSize = cover ? (title.length > 64 ? 46 : 54) : title.length > 64 ? 60 : 72;
  const coverHeight = size.height - 128;
  return render(
    <div style={{ display: "flex", width: "100%", gap: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
        <Label color={c.scarlet}>{`${project.area} · ${project.year}`.toLowerCase()}</Label>
        <div style={{ display: "flex", fontSize: titleSize, fontWeight: 600, letterSpacing: titleSize * -0.03, lineHeight: 1.08 }}>
          {title}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Label color={c.ink}>{project.title}</Label>
          <Label>{site.brand}</Label>
        </div>
      </div>
      {cover && (
        <div
          style={{
            display: "flex",
            width: 480,
            borderRadius: 16,
            overflow: "hidden",
            background: c.card,
            boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.06), 0 24px 48px -20px rgba(0, 0, 0, 0.22)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- Satori markup, not a page */}
          <img
            src={cover}
            width={480}
            height={coverHeight}
            style={{ width: 480, height: coverHeight, objectFit: "cover", objectPosition: project.cover.focus ?? "center" }}
          />
        </div>
      )}
    </div>,
    size,
  );
}

// ---- Exports for `pnpm cards` ---------------------------------------------------

/** Every card `pnpm cards` saves: the portfolio repo's preview, the LinkedIn banner, and one preview per case-study repo. */
export function exportCardNames() {
  return ["home-github", "home-banner", ...caseStudySlugs.map((slug) => `${slug}-github`)];
}

export async function exportCard(name: string) {
  if (name === "home-github") return siteCard({ size: githubSize });
  if (name === "home-banner") return bannerCard();
  const project = getProject(name.replace(/-github$/, ""));
  return name.endsWith("-github") && project ? caseStudyCard(project, githubSize) : null;
}
