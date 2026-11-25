import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import type { Media, Project } from "@/content/projects";
import { site } from "@/content/site";

// Case-study link-preview cards (work/[slug]/opengraph-image.tsx). The home preview is a room
// render, app/opengraph-image.jpg. Satori renders these cards, so every element with more than one
// child needs display: flex, and colors are hex values copied from styles/tokens.css.

export const ogSize = { width: 1200, height: 630 };

const c = {
  paper: "#f5f5f7",
  card: "#ffffff",
  ink: "#1d1d1f",
  muted: "#5f5f66",
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

async function render(children: ReactNode) {
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
          padding: "64px 72px",
        }}
      >
        {children}
      </div>
    ),
    { ...ogSize, fonts: await fonts() },
  );
}

function Label({ children, color = c.muted }: { children: ReactNode; color?: string }) {
  return <div style={{ display: "flex", fontFamily: mono, fontWeight: 500, fontSize: 26, color, letterSpacing: -0.3 }}>{children}</div>;
}

/** Case study card: area, headline and project name, with the cover on the right when there is one. */
export async function caseStudyCard(project: Project) {
  const cover = await coverData(project.cover);
  const title = project.caseStudy.title;
  const titleSize = cover ? (title.length > 64 ? 46 : 54) : title.length > 64 ? 60 : 72;
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
            height={502}
            style={{ width: 480, height: 502, objectFit: "cover", objectPosition: project.cover.focus ?? "center" }}
          />
        </div>
      )}
    </div>,
  );
}
