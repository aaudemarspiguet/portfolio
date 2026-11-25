"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type MouseEvent } from "react";
import { site } from "@/content/site";
import { initGlobalSfx } from "@/lib/sfx";
import { GitHubIcon, LinkedInIcon } from "./icons";
import { HomeLink } from "./HomeLink";
import { MobileBar } from "./MobileBar";
import { MoreMenu } from "./MoreMenu";
import { useStudioNav, useStudioView, type RoomNavKey } from "./StudioViewProvider";
import { useApplySavedTheme } from "./ThemeToggle";
import { ViewSwitch } from "./ViewSwitch";

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

export function NavBar({ workSlugs }: { workSlugs: string[] }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const caseStudySlug = pathname.startsWith("/work/") ? pathname.slice("/work/".length) : null;
  const current = useCurrentKey(pathname, caseStudySlug, workSlugs);
  const router = useRouter();
  const { view, webglFailed, setView, navigateInRoom, switchView } = useStudioView();

  const href = (hash: string) => (onHome ? hash : `/${hash}`);
  const canSwitchView = onHome && !webglFailed;
  // The toggle zooms between the screen and the room and keeps you in the same section.
  const toggleView = switchView;

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
          {canSwitchView && <ViewSwitch className="ln-icon-btn" onToggle={toggleView} />}
          <MoreMenu buttonClassName="ln-icon-btn" withLinks={false} />
        </div>
      </div>
    </header>
  );
}
