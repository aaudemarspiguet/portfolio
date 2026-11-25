"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import type { HomeProject } from "@/content/project-types";
import type { Role } from "@/content/site";
import { useTheme } from "../ThemeToggle";
import { TERMINAL_PROMPT } from "../TypingTagline";

export type PeekState =
  | { kind: "case"; project: HomeProject; swapDir?: 1 | -1 }
  | { kind: "all" }
  | { kind: "about" }
  | { kind: "terminal" }
  | null;

export function RoomPeeks({
  peek,
  projects,
  roles,
  aboutParagraphs,
  onClose,
  onStepProject,
  onSelectProject,
  onAllProjects,
}: {
  peek: PeekState;
  projects: HomeProject[];
  roles: Role[];
  aboutParagraphs: string[];
  onClose: () => void;
  onStepProject: (index: number, dir: 1 | -1) => void;
  onSelectProject: (index: number) => void;
  onAllProjects: () => void;
}) {
  const theme = useTheme();
  const isDark = theme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  // Focus management: focus close button on initial open, keep step button on prev/next, restore on close.
  useEffect(() => {
    const isOpen = peek !== null;
    if (isOpen && !wasOpenRef.current) {
      lastFocusRef.current = document.activeElement as HTMLElement | null;
      wasOpenRef.current = true;
      const closeBtn = containerRef.current?.querySelector<HTMLElement>("[data-close]");
      closeBtn?.focus({ preventScroll: true });
    } else if (isOpen && peek?.kind === "case" && peek.swapDir) {
      const stepBtn = containerRef.current?.querySelector<HTMLElement>(`[data-step="${peek.swapDir}"]`);
      stepBtn?.focus({ preventScroll: true });
    } else if (!isOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      const prev = lastFocusRef.current;
      lastFocusRef.current = null;
      if (prev && document.contains(prev)) {
        prev.focus({ preventScroll: true });
      }
    }
  }, [peek]);

  // Keyboard navigation while a peek is open: Escape closes, Left/Right steps projects.
  useEffect(() => {
    if (!peek) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (peek?.kind === "case" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        const dir: 1 | -1 = e.key === "ArrowRight" ? 1 : -1;
        const idx = projects.findIndex((p) => p.slug === peek.project.slug);
        if (idx >= 0) {
          e.preventDefault();
          onStepProject(idx + dir, dir);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [peek, projects, onClose, onStepProject]);

  if (!peek) return null;

  return (
    <div
      ref={containerRef}
      className="ln-peek"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {peek.kind === "case" && <CasePeek project={peek.project} projects={projects} isDark={isDark} onClose={onClose} onStepProject={onStepProject} onAllProjects={onAllProjects} />}
      {peek.kind === "all" && <AllProjectsPeek projects={projects} isDark={isDark} onClose={onClose} onSelectProject={onSelectProject} />}
      {peek.kind === "about" && <AboutPeek paragraphs={aboutParagraphs} onClose={onClose} />}
      {peek.kind === "terminal" && <TerminalPeek roles={roles} onClose={onClose} />}
    </div>
  );
}

// Each peek is a modal card: a close (×) pinned in the top-right corner, a scrolling body, and one
// footer that holds every other action together (main links, then prev / count / next).
function PeekCard({
  className = "",
  onClose,
  actions,
  children,
}: {
  className?: string;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`ln-peek__card ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby="peekTitle">
      <button type="button" className="ln-icon-btn ln-peek__x" data-close aria-label="Close" onClick={onClose}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <div className="ln-peek__body">{children}</div>
      {actions && <div className="ln-peek__actions">{actions}</div>}
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ln-peek__icon">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
  );
}

function CasePeek({
  project,
  projects,
  isDark,
  onClose,
  onStepProject,
  onAllProjects,
}: {
  project: HomeProject;
  projects: HomeProject[];
  isDark: boolean;
  onClose: () => void;
  onStepProject: (index: number, dir: 1 | -1) => void;
  onAllProjects: () => void;
}) {
  const i = Math.max(0, projects.findIndex((p) => p.slug === project.slug));
  const n = projects.length;
  const prev = projects[(i - 1 + n) % n];
  const next = projects[(i + 1) % n];
  const imgSrc = project.cover.srcDark && isDark ? project.cover.srcDark : project.cover.src;

  return (
    <PeekCard
      className="ln-peek__card--case"
      onClose={onClose}
      actions={
        <>
          <div className="ln-peek__go">
            <Link href={`/work/${project.slug}`} className="ln-btn ln-btn--primary">
              Read the case study ↗
            </Link>
            <button type="button" className="ln-btn ln-btn--ghost ln-peek__all" aria-label="All projects" onClick={onAllProjects}>
              <GridIcon />
              <span className="ln-peek__wide">All projects</span>
            </button>
          </div>
          <span className="ln-peek__steps">
            <button
              type="button"
              className="ln-btn ln-btn--ghost ln-peek__step"
              data-step="-1"
              aria-label={`Previous project: ${prev.title}`}
              onClick={() => onStepProject(i - 1, -1)}
            >
              ‹ Prev
            </button>
            <span className="ln-peek__count">
              {i + 1} / {n}
            </span>
            <button
              type="button"
              className="ln-btn ln-btn--ghost ln-peek__step"
              data-step="1"
              aria-label={`Next project: ${next.title}`}
              onClick={() => onStepProject(i + 1, 1)}
            >
              Next ›
            </button>
          </span>
        </>
      }
    >
      <div className="ln-peek__text">
        <span className="ln-peek__code">
          {project.area.toLowerCase()} · {project.year}
        </span>
        <h2 id="peekTitle">{project.title}</h2>
        <p>{project.lede}</p>
        <span className="ln-peek__tags">{project.tags.join(" · ").toLowerCase()}</span>
      </div>

      <figure className="ln-peek__fig">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={project.cover.alt} />
      </figure>
    </PeekCard>
  );
}

function AllProjectsPeek({
  projects,
  isDark,
  onClose,
  onSelectProject,
}: {
  projects: HomeProject[];
  isDark: boolean;
  onClose: () => void;
  onSelectProject: (index: number) => void;
}) {
  return (
    <PeekCard className="ln-peek__card--one ln-peek__card--all" onClose={onClose}>
      <div className="ln-peek__text">
        <h2 id="peekTitle">All projects</h2>
      </div>
      <div className="ln-allgrid">
        {projects.map((p, idx) => (
          <button key={p.slug} type="button" className="ln-alltile" onClick={() => onSelectProject(idx)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.cover.srcDark && isDark ? p.cover.srcDark : p.cover.src} alt="" />
            <b>{p.title}</b>
            <span>
              {p.area.toLowerCase()} · {p.year}
            </span>
          </button>
        ))}
      </div>
    </PeekCard>
  );
}

function AboutPeek({ paragraphs, onClose }: { paragraphs: string[]; onClose: () => void }) {
  return (
    <PeekCard className="ln-peek__card--one" onClose={onClose}>
      <div className="ln-peek__text">
        <h2 id="peekTitle">A little about me</h2>
        <div className="ln-about-copy">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </PeekCard>
  );
}

function TerminalPeek({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  return (
    <div className="ln-term" role="dialog" aria-modal="true" aria-label="Experience">
      <div className="ln-term__screen">
        <div className="ln-term__row">
          <span className="g">{TERMINAL_PROMPT}cat experience/*.txt</span>
          <button type="button" className="ln-pill" data-close onClick={onClose}>
            exit
          </button>
        </div>
        {roles.map((r) => (
          <p key={`${r.org}-${r.when}`} className="ln-term__entry">
            <span className="b">{r.title}</span> <span className="d">@</span> {r.org}{" "}
            <span className="d">· {r.when}</span>
            <span className="l">{r.line}</span>
          </p>
        ))}
        <span className="g">{TERMINAL_PROMPT}</span>
        <span className="ln-caret" aria-hidden="true" />
      </div>
    </div>
  );
}
