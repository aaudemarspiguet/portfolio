"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { ThemeToggle, setTheme, useTheme } from "./ThemeToggle";

const SECTIONS = [
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "about", label: "About" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

// Home: the pill follows the section in view. Case studies: Work stays selected.
function useCurrentSection(onHome: boolean, onCaseStudy: boolean): SectionId | null {
  const [spied, setSpied] = useState<SectionId>("work");

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
  return onCaseStudy ? "work" : null;
}

export function NavBar() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const current = useCurrentSection(onHome, pathname.startsWith("/work/"));
  const href = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  return (
    <header className="ln-header">
      <div className="ln-nav">
        <Link href={onHome ? "#top" : "/"} className="ln-nav__name">
          {site.name}
        </Link>
        <nav aria-label="Main" className="ln-nav__links">
          {SECTIONS.map(({ id, label }) => (
            <a key={id} href={href(id)} className="ln-nav__item" aria-current={current === id ? "location" : undefined}>
              {label}
            </a>
          ))}
          <a href={site.links.resume} className="ln-btn ln-btn--sm">Résumé</a>
          <ThemeToggle />
        </nav>
        <div className="ln-nav__phone">
          <a href={site.links.resume} className="ln-btn ln-btn--sm">Résumé</a>
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
