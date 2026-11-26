"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { HomeProject } from "@/content/project-types";
import type { Role } from "@/content/site";
import { BackgroundBlock } from "../Background";
import { Sheet } from "../glass/Sheet";
import { useTheme } from "../ThemeToggle";
import { TERMINAL_PROMPT } from "../TypingTagline";
import { useIsPhone } from "../useIsPhone";

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
  aboutCopy,
  onClose,
  onStepProject,
  onSelectProject,
  onAllProjects,
}: {
  peek: PeekState;
  projects: HomeProject[];
  roles: Role[];
  /** The About paragraphs, rendered on the server. */
  aboutCopy: ReactNode;
  onClose: () => void;
  onStepProject: (index: number, dir: 1 | -1) => void;
  onSelectProject: (index: number) => void;
  onAllProjects: () => void;
}) {
  const theme = useTheme();
  const isDark = theme === "dark";
  const isPhone = useIsPhone();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  // Focus management: focus close button on initial open, keep step button on prev/next, restore on close.
  useEffect(() => {
    const isOpen = peek !== null;
    if (isOpen && !wasOpenRef.current) {
      lastFocusRef.current = document.activeElement as HTMLElement | null;
      wasOpenRef.current = true;
      // Phone sheets render into body, outside the container, so look there too.
      const closeBtn =
        containerRef.current?.querySelector<HTMLElement>("[data-close]") ??
        document.querySelector<HTMLElement>(".ln-gsheet [data-close]");
      closeBtn?.focus({ preventScroll: true });
    } else if (isOpen && peek?.kind === "case" && peek.swapDir) {
      const stepBtn =
        containerRef.current?.querySelector<HTMLElement>(`[data-step="${peek.swapDir}"]`) ??
        document.querySelector<HTMLElement>(`.ln-gsheet [data-step="${peek.swapDir}"]`);
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

  // Phones: every peek is a swipe-up sheet with the close button in the top-left corner.
  if (isPhone) {
    return (
      <div ref={containerRef} className="ln-peek ln-peek--sheet">
        {peek.kind === "case" && (
          <CaseSheet project={peek.project} projects={projects} isDark={isDark} onClose={onClose} onStepProject={onStepProject} onAllProjects={onAllProjects} />
        )}
        {peek.kind === "all" && (
          <Sheet key="all" title="All projects" titleId="peekTitle" onClose={onClose}>
            <AllGrid projects={projects} isDark={isDark} onSelectProject={onSelectProject} />
          </Sheet>
        )}
        {peek.kind === "about" && (
          <Sheet key="about" title="About" onClose={onClose}>
            <AboutPages copy={aboutCopy} />
          </Sheet>
        )}
        {peek.kind === "terminal" && (
          <Sheet key="terminal" title="Experience" onClose={onClose} className="ln-gsheet--term">
            <TerminalScreen roles={roles} />
          </Sheet>
        )}
      </div>
    );
  }

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
      {peek.kind === "about" && <AboutPeek copy={aboutCopy} onClose={onClose} />}
      {peek.kind === "terminal" && <TerminalPeek roles={roles} onClose={onClose} />}
    </div>
  );
}

// Each peek is a modal card with the same glass header as the phone sheets: close (×) in the
// top-left corner, the peek's name in the middle, then a scrolling body and one footer of actions.
function PeekCard({
  title,
  titleId,
  className = "",
  onClose,
  actions,
  children,
}: {
  title: string;
  /** Set when the header's name is the dialog's only title. */
  titleId?: string;
  className?: string;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`ln-peek__card ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby="peekTitle">
      <div className="ln-peek__head">
        <button type="button" className="ln-gbtn ln-gsheet__x" data-close aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <span id={titleId} className="ln-gsheet__title">
          {title}
        </span>
        <span aria-hidden="true" />
      </div>
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

function caseIndex(project: HomeProject, projects: HomeProject[]) {
  const i = Math.max(0, projects.findIndex((p) => p.slug === project.slug));
  const n = projects.length;
  return { i, n, prev: projects[(i - 1 + n) % n], next: projects[(i + 1) % n] };
}

function CaseActions({
  project,
  projects,
  onStepProject,
  onAllProjects,
  steps = true,
}: {
  project: HomeProject;
  projects: HomeProject[];
  onStepProject: (index: number, dir: 1 | -1) => void;
  onAllProjects: () => void;
  /** Prev and Next under the buttons. Phones step from the sheet's header instead. */
  steps?: boolean;
}) {
  const { i, n, prev, next } = caseIndex(project, projects);
  return (
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
      {steps && (
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
      )}
    </>
  );
}

function CaseBody({ project, isDark, titleId }: { project: HomeProject; isDark: boolean; titleId?: string }) {
  const imgSrc = project.cover.srcDark && isDark ? project.cover.srcDark : project.cover.src;
  return (
    <>
      <div className="ln-peek__text">
        <span className="ln-peek__code">
          {project.area.toLowerCase()} · {project.year}
        </span>
        <h2 id={titleId}>{project.title}</h2>
        <p>{project.lede}</p>
        <span className="ln-peek__tags">{project.tags.join(" · ").toLowerCase()}</span>
      </div>

      <figure className="ln-peek__fig">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={project.cover.alt} />
      </figure>
    </>
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
  return (
    <PeekCard
      title="Projects"
      className="ln-peek__card--case"
      onClose={onClose}
      actions={<CaseActions project={project} projects={projects} onStepProject={onStepProject} onAllProjects={onAllProjects} />}
    >
      <CaseBody project={project} isDark={isDark} titleId="peekTitle" />
    </PeekCard>
  );
}

function CaseSheet({
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
  const { i, n, prev, next } = caseIndex(project, projects);
  return (
    <Sheet
      key="case"
      title="Projects"
      eyebrow={`${i + 1} of ${n}`}
      onClose={onClose}
      className="ln-gsheet--case"
      headerEnd={
        <span className="ln-gsheet__stepper" role="group" aria-label="Step through projects">
          <button
            type="button"
            className="ln-gbtn"
            data-step="-1"
            aria-label={`Previous project: ${prev.title}`}
            onClick={() => onStepProject(i - 1, -1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 15l6-6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            className="ln-gbtn"
            data-step="1"
            aria-label={`Next project: ${next.title}`}
            onClick={() => onStepProject(i + 1, 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </span>
      }
      footer={<CaseActions project={project} projects={projects} onStepProject={onStepProject} onAllProjects={onAllProjects} steps={false} />}
    >
      <CaseBody project={project} isDark={isDark} />
    </Sheet>
  );
}

function AllGrid({
  projects,
  isDark,
  onSelectProject,
}: {
  projects: HomeProject[];
  isDark: boolean;
  onSelectProject: (index: number) => void;
}) {
  return (
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
    <PeekCard title="All projects" titleId="peekTitle" className="ln-peek__card--one ln-peek__card--all" onClose={onClose}>
      <AllGrid projects={projects} isDark={isDark} onSelectProject={onSelectProject} />
    </PeekCard>
  );
}

/**
 * About has two pages, Me and Background, under one segmented control: the plain scroll's About
 * section holds the same two parts in order.
 */
function AboutPages({ copy, titleId }: { copy: ReactNode; titleId?: string }) {
  const [page, setPage] = useState<"me" | "background">("me");
  return (
    <div className="ln-aboutpages">
      <div className="ln-seg" role="tablist" aria-label="About">
        <button type="button" role="tab" id="aboutTabMe" aria-selected={page === "me"} aria-controls="aboutPaneMe" onClick={() => setPage("me")}>
          Me
        </button>
        <button
          type="button"
          role="tab"
          id="aboutTabBg"
          aria-selected={page === "background"}
          aria-controls="aboutPaneBg"
          onClick={() => setPage("background")}
        >
          Background
        </button>
      </div>
      <div className="ln-peek__text" role="tabpanel" id="aboutPaneMe" aria-labelledby="aboutTabMe" hidden={page !== "me"}>
        <h2 id={titleId}>A little about me</h2>
        {copy}
      </div>
      <div className="ln-aboutpages__bg" role="tabpanel" id="aboutPaneBg" aria-labelledby="aboutTabBg" hidden={page !== "background"}>
        <h2>Education and tools</h2>
        <BackgroundBlock />
      </div>
    </div>
  );
}

function AboutPeek({ copy, onClose }: { copy: ReactNode; onClose: () => void }) {
  return (
    <PeekCard title="About" className="ln-peek__card--one" onClose={onClose}>
      <AboutPages copy={copy} titleId="peekTitle" />
    </PeekCard>
  );
}

function TerminalLines({ roles }: { roles: Role[] }) {
  return (
    <>
      {roles.map((r) => (
        <p key={`${r.org}-${r.when}`} className="ln-term__entry">
          <span className="b">{r.title}</span> <span className="d">@</span> {r.org}{" "}
          <span className="d">· {r.when}</span>
          <span className="l">{r.line}</span>
        </p>
      ))}
      <span className="g">{TERMINAL_PROMPT}</span>
      <span className="ln-caret" aria-hidden="true" />
    </>
  );
}

/** The terminal inside a phone sheet: the sheet's × replaces the exit button. */
function TerminalScreen({ roles }: { roles: Role[] }) {
  return (
    <div className="ln-term__screen">
      <div className="ln-term__row">
        <span className="g">{TERMINAL_PROMPT}cat experience/*.txt</span>
      </div>
      <TerminalLines roles={roles} />
    </div>
  );
}

function TerminalPeek({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  return (
    <div className="ln-term" role="dialog" aria-modal="true" aria-label="Experience">
      <div className="ln-term__screen">
        <div className="ln-term__row">
          <span className="g">{TERMINAL_PROMPT}cat experience/*.txt</span>
          <button type="button" className="ln-btn ln-btn--sm" data-close onClick={onClose}>
            exit
          </button>
        </div>
        <TerminalLines roles={roles} />
      </div>
    </div>
  );
}
