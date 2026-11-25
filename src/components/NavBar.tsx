"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type MouseEvent } from "react";
import { site } from "@/content/site";
import { initGlobalSfx } from "@/lib/sfx";
import { CubeIcon } from "./CubeIcon";
import { HomeLink } from "./HomeLink";
import { MobileBar } from "./MobileBar";
import { MoreMenu } from "./MoreMenu";
import { useStudioNav, useStudioView, type RoomNavKey } from "./StudioViewProvider";
import { useApplySavedTheme } from "./ThemeToggle";

const NAV_ITEMS: { key: RoomNavKey; label: string; hash: string }[] = [
  { key: "work", label: "Projects", hash: "#work" },
  { key: "experience", label: "Experience", hash: "#experience" },
  { key: "about", label: "About", hash: "#about" },
];

function useCurrentKey(pathname: string, caseStudySlug: string | null, workSlugs: string[]): RoomNavKey | null {
  const onHome = pathname === "/";
  const { view } = useStudioView();
  const { roomCurrent, plainSection } = useStudioNav();

  if (onHome) {
    if (view === "room") return roomCurrent;
    return plainSection;
  }
  if (pathname === "/projects") return "work";
  if (!caseStudySlug) return null;
  return workSlugs.includes(caseStudySlug) ? "experience" : "work";
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-fillicon">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03a9.5 9.5 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-fillicon">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

export function NavBar({ workSlugs }: { workSlugs: string[] }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const caseStudySlug = pathname.startsWith("/work/") ? pathname.slice("/work/".length) : null;
  const current = useCurrentKey(pathname, caseStudySlug, workSlugs);
  const router = useRouter();
  const { view, webglFailed, setView, navigateInRoom } = useStudioView();

  const href = (hash: string) => (onHome ? hash : `/${hash}`);
  const canSwitchView = onHome && !webglFailed;
  const toggleView = () => setView(view === "room" ? "plain" : "room");

  // Click sounds and the saved appearance are set up once, here, for every screen size.
  useEffect(() => initGlobalSfx(), []);
  useApplySavedTheme();

  // Room view flies the camera; plain view scrolls the one long page to the section.
  function goToSection(key: RoomNavKey) {
    if (view === "room" && !webglFailed && navigateInRoom(key)) return;
    setView("plain", key);
  }

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, key: RoomNavKey) {
    if (!onHome) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goToSection(key);
  }

  function navFromMenu(key: RoomNavKey) {
    if (onHome) goToSection(key);
    else router.push(`/#${key}`);
  }

  return (
    <header className="ln-header">
      {/* Phones get one full-width Liquid Glass bar instead of the pill. */}
      <MobileBar current={current} onHome={onHome} canSwitchView={canSwitchView} onNav={navFromMenu} onToggleView={toggleView} />
      <div className="ln-nav">
        <HomeLink className="ln-nav__brand">{site.brand}</HomeLink>

        <nav aria-label="Main" className="ln-nav__links">
          {NAV_ITEMS.map(({ key, label, hash }) => (
            <a
              key={key}
              href={href(hash)}
              className="ln-nav__item"
              aria-current={current === key ? "true" : undefined}
              onClick={(e) => handleNavClick(e, key)}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ln-nav__end">
          <a
            className="ln-icon-btn ln-nav__social"
            href={site.links.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <GitHubIcon />
          </a>
          <a
            className="ln-icon-btn ln-nav__social"
            href={site.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <LinkedInIcon />
          </a>
          {canSwitchView && (
            <button
              type="button"
              className="ln-icon-btn ln-nav__cube"
              aria-label="Room view"
              title="Room view"
              aria-pressed={view === "room"}
              onClick={toggleView}
            >
              <CubeIcon />
            </button>
          )}
          <MoreMenu buttonClassName="ln-icon-btn" withLinks={false} />
        </div>
      </div>
    </header>
  );
}
