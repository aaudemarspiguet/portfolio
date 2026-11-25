"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { site } from "@/content/site";
import { HomeLink } from "./HomeLink";
import { SfxToggle } from "./SfxToggle";
import { useStudioView, type RoomNavKey } from "./StudioViewProvider";
import { ThemeToggle } from "./ThemeToggle";

const NAV_ITEMS: { key: RoomNavKey; label: string; hash: string }[] = [
  { key: "work", label: "Projects", hash: "#work" },
  { key: "experience", label: "Experience", hash: "#experience" },
  { key: "about", label: "About", hash: "#about" },
];

type NavKey = RoomNavKey | "background";

function useCurrentKey(pathname: string, caseStudySlug: string | null, workSlugs: string[]): NavKey | null {
  const onHome = pathname === "/";
  const { view, roomCurrent, plainSection } = useStudioView();

  if (onHome) {
    if (view === "about") return "about";
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
  const { view, webglFailed, setView, navigateInRoom } = useStudioView();

  const href = (hash: string) => (onHome ? hash : `/${hash}`);
  const canSwitchView = onHome && !webglFailed;
  const viewLabel = view === "room" ? "plain view" : "room view";
  const toggleView = () => setView(view === "room" ? "plain" : "room");

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, key: NavKey) {
    if (!onHome) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();

    if (key === "background") {
      setView("plain", "background");
      return;
    }

    if (view === "room" && !webglFailed && navigateInRoom(key)) {
      return;
    }

    if (key === "about") {
      setView("about", null, true);
      return;
    }

    setView("plain", key);
  }

  return (
    <header className="ln-header">
      <div className="ln-nav">
        <HomeLink className="ln-nav__brand">{site.brand}</HomeLink>

        <nav aria-label="Main" className="ln-nav__links">
          {NAV_ITEMS.map(({ key, label, hash }) => (
            <a
              key={key}
              href={href(hash)}
              className="ln-nav__item"
              aria-current={current === key ? (key === "about" ? "page" : "true") : undefined}
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
            <button type="button" className="ln-viewbtn" aria-pressed={view !== "room"} onClick={toggleView}>
              {viewLabel}
            </button>
          )}
          <SfxToggle className="ln-icon-btn ln-nav__sfx" />
          <ThemeToggle />
          {/* Phones: the pill keeps the wordmark, theme and this menu, like production. The view
              switch and sound live inside the menu. */}
          <MobileMenu
            current={current}
            href={href}
            onNavClick={handleNavClick}
            viewLabel={canSwitchView ? viewLabel : null}
            onToggleView={toggleView}
          />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({
  current,
  href,
  onNavClick,
  viewLabel,
  onToggleView,
}: {
  current: NavKey | null;
  href: (hash: string) => string;
  onNavClick: (event: MouseEvent<HTMLAnchorElement>, key: NavKey) => void;
  viewLabel: string | null;
  onToggleView: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  function show() {
    document.documentElement.classList.add("ln-locked");
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLElement>("[data-close]")?.focus();
    setOpen(true);
  }

  function hide() {
    document.documentElement.classList.remove("ln-locked");
    if (dialog.current?.open) dialog.current.close();
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    hide();
  }

  useEffect(() => {
    if (!dialog.current?.open) return;
    document.documentElement.classList.remove("ln-locked");
    dialog.current.close();
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const wide = window.matchMedia("(min-width: 641px)");
    const onChange = () => wide.matches && hide();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [open]);

  const sheetItems: { key: NavKey; label: string; hash: string }[] = [
    ...NAV_ITEMS,
    { key: "background", label: "Background", hash: "#background" },
  ];

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="ln-icon-btn ln-menubtn"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="ln-sheet"
        onClick={show}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <dialog
        ref={dialog}
        id="ln-sheet"
        className="ln-sheet"
        aria-label="Menu"
        onKeyDown={onKeyDown}
        onCancel={(e) => {
          e.preventDefault();
          hide();
        }}
      >
        <div className="ln-sheet__bar">
          <HomeLink className="ln-nav__brand" onClick={hide}>
            {site.brand}
          </HomeLink>
          <div className="ln-sheet__actions">
            <ThemeToggle />
            <button type="button" className="ln-icon-btn" aria-label="Close menu" data-close onClick={hide}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
        <nav aria-label="Menu" className="ln-sheet__links">
          {sheetItems.map(({ key, label, hash }) => (
            <a
              key={key}
              href={href(hash)}
              aria-current={current === key ? (key === "about" ? "page" : "true") : undefined}
              onClick={(e) => {
                hide();
                onNavClick(e, key);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        {/* Everything that isn't navigation sits at the bottom, in reach of a thumb. */}
        <div className="ln-sheet__foot">
          <div className="ln-sheet__row">
            {viewLabel && (
              <button
                type="button"
                className="ln-btn"
                onClick={() => {
                  hide();
                  onToggleView();
                }}
              >
                {viewLabel}
              </button>
            )}
            <SfxToggle className="ln-btn ln-sheet__sfx" labeled />
          </div>
          <div className="ln-sheet__row">
            <a className="ln-btn" href={site.links.github} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            <a className="ln-btn" href={site.links.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn ↗
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
