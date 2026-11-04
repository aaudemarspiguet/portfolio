"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { getProject } from "@/content/projects";
import { site } from "@/content/site";
import { HomeLink } from "./HomeLink";
import { ThemeToggle } from "./ThemeToggle";

const SECTIONS = [
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "about", label: "About" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// Home: the pill follows the section in view. The all-projects page and case
// studies keep Projects, or Experience for a work case study, selected.
function useCurrentSection(pathname: string, caseStudySlug: string | null): SectionId | null {
  const onHome = pathname === "/";
  const [spied, setSpied] = useState<SectionId>("projects");

  useEffect(() => {
    if (!onHome) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setSpied(entry.target.id as SectionId);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [onHome]);

  if (onHome) return spied;
  if (pathname === "/projects") return "projects";
  if (!caseStudySlug) return null;
  return getProject(caseStudySlug)?.kind === "work" ? "experience" : "projects";
}

// Three zones: wordmark left, sections centered on the page, actions right.
export function NavBar() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const caseStudySlug = pathname.startsWith("/work/") ? pathname.slice("/work/".length) : null;
  const current = useCurrentSection(pathname, caseStudySlug);
  const href = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  return (
    <header className="ln-header">
      <div className="ln-nav">
        <HomeLink className="ln-nav__brand">
          {site.brand}
        </HomeLink>
        <nav aria-label="Main" className="ln-nav__links">
          {SECTIONS.map(({ id, label }) => (
            <a key={id} href={href(id)} className="ln-nav__item" aria-current={current === id ? "location" : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <div className="ln-nav__actions">
          <ThemeToggle />
        </div>
        <div className="ln-nav__phone">
          <MobileMenu current={current} href={href} />
        </div>
      </div>
    </header>
  );
}

// Closed: the pill keeps the wordmark, a theme icon and a hamburger. Open: a
// full-screen modal <dialog>, which keeps focus inside and closes on Escape.
function MobileMenu({ current, href }: { current: SectionId | null; href: (id: string) => string }) {
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

  // Every way out runs this directly rather than waiting for the dialog's
  // close event, so scrolling unlocks before the browser follows a link.
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

  // Close when the route changes or the viewport grows past the phone layout.
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

  return (
    <>
      <ThemeToggle />
      <button ref={trigger} type="button" className="ln-icon-btn" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={open} aria-controls="ln-sheet" onClick={show}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <dialog ref={dialog} id="ln-sheet" className="ln-sheet" aria-label="Menu" onKeyDown={onKeyDown} onCancel={(e) => { e.preventDefault(); hide(); }}>
        <div className="ln-sheet__bar">
          <HomeLink className="ln-nav__brand" onClick={hide}>
            {site.brand}
          </HomeLink>
          <div className="ln-sheet__actions">
            <ThemeToggle />
            <button type="button" className="ln-icon-btn" aria-label="Close menu" data-close onClick={hide}>
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
        <nav aria-label="Main" className="ln-sheet__links">
          <HomeLink onClick={hide}>Home</HomeLink>
          {SECTIONS.map(({ id, label }) => (
            <a key={id} href={href(id)} aria-current={current === id ? "location" : undefined} onClick={hide}>
              {label}
            </a>
          ))}
        </nav>
      </dialog>
    </>
  );
}
