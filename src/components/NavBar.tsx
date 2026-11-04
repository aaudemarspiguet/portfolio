"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getProject } from "@/content/projects";
import { site } from "@/content/site";
import { HomeLink } from "./HomeLink";
import { ThemeToggle, setTheme, useTheme } from "./ThemeToggle";

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

function MobileMenu({ current, href }: { current: SectionId | null; href: (id: string) => string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div ref={root}>
      <button type="button" className="ln-menu-btn" aria-expanded={open} aria-controls="ln-menu" onClick={() => setOpen(!open)}>
        {open ? "Close" : "Menu"}
      </button>
      {open && (
        <nav id="ln-menu" aria-label="Main" className="ln-menu">
          {SECTIONS.map(({ id, label }) => (
            <a key={id} href={href(id)} aria-current={current === id ? "location" : undefined} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <button type="button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </nav>
      )}
    </div>
  );
}
