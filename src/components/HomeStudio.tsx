"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Component,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { HomeProject } from "@/content/project-types";
import type { site as SiteType } from "@/content/site";
import { CopyEmail } from "./CopyEmail";
import { ExperienceRow } from "./ExperienceRow";
import { SectionHeader } from "./marks";
import { NameTooltip } from "./NameTooltip";
import { ProjectCollage } from "./ProjectCollage";
import { TypingTagline } from "./TypingTagline";
import { useStudioView, type PlainSectionKey, type RoomNavKey } from "./StudioViewProvider";
import { BootScreen } from "./BootScreen";
import type { RoomActions } from "./room/StudioRoom";
import { RoomPeeks, type PeekState } from "./room/RoomPeeks";

const StudioRoom = dynamic(() => import("./room/StudioRoom"), { ssr: false });

class RoomErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function HomeStudio({
  siteData,
  projects,
  roleCaseStudies,
  contactPanel,
}: {
  siteData: typeof SiteType;
  projects: HomeProject[];
  roleCaseStudies: Record<string, string | undefined>;
  contactPanel: ReactNode;
}) {
  const {
    view,
    hydrated,
    webglFailed,
    pendingSection,
    clearPendingSection,
    setView,
    setRoomCurrent,
    setPlainSection,
    markWebglFailed,
    registerRoomHandlers,
  } = useStudioView();

  const stageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroScreenRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<RoomActions | null>(null);

  // Load progress goes straight to the boot screen's animation loop, so it never re-renders this tree.
  const progressRef = useRef(0);
  const [roomReady, setRoomReady] = useState(false);
  const [peek, setPeek] = useState<PeekState>(null);

  const handleRegisterActions = useCallback(
    (actions: RoomActions | null) => {
      actionsRef.current = actions;
      if (actions) {
        registerRoomHandlers({
          nav: actions.nav,
          backToScreen: actions.backToScreen,
        });
      } else {
        registerRoomHandlers(null);
      }
    },
    [registerRoomHandlers],
  );

  const handleOpenPeek = useCallback(
    (next: PeekState, section: RoomNavKey | null) => {
      setPeek(next);
      setRoomCurrent(section);
    },
    [setRoomCurrent],
  );

  const handleClosePeekState = useCallback(() => {
    setPeek(null);
    setRoomCurrent(null);
  }, [setRoomCurrent]);

  const handleClosePeek = useCallback(() => {
    actionsRef.current?.closePeekToWide();
  }, []);

  const handleStepProject = useCallback((index: number, dir: 1 | -1) => {
    actionsRef.current?.goToProject(index, dir);
  }, []);

  const handleSelectProject = useCallback((index: number) => {
    actionsRef.current?.goToProject(index);
  }, []);

  const handleAllProjects = useCallback(() => {
    actionsRef.current?.goToAll();
  }, []);

  const handleSwitchToPlain = useCallback(() => {
    setView("plain");
  }, [setView]);

  const handleRoomReady = useCallback(() => {
    progressRef.current = 1;
    setRoomReady(true);
  }, []);

  const handleRoomProgress = useCallback((ratio: number) => {
    progressRef.current = Math.max(progressRef.current, ratio);
  }, []);

  // Scroll to a requested section after switching into plain view.
  useEffect(() => {
    if (view !== "plain" || !pendingSection) return;
    const el = document.getElementById(pendingSection);
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "start" });
      clearPendingSection();
    }
  }, [view, pendingSection, clearPendingSection]);

  // Plain view section spy.
  useEffect(() => {
    if (view !== "plain" || typeof IntersectionObserver === "undefined") return;
    const ids: PlainSectionKey[] = ["work", "experience", "background"];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPlainSection(entry.target.id as PlainSectionKey);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [view, setPlainSection]);

  const heroMeta = `${siteData.role.toLowerCase()} · ${siteData.city.toLowerCase()} · ${siteData.availability.toLowerCase()}`;
  const bootReady = view === "room" ? roomReady || webglFailed : hydrated;

  return (
    <>
      <BootScreen progress={progressRef} ready={bootReady} />

      <div className="ln-wrap">
        <section ref={stageRef} className="ln-stage" id="room" aria-label="The room" hidden={view !== "room"}>
          {hydrated && view === "room" && !webglFailed && (
            <RoomErrorBoundary onError={markWebglFailed}>
              <StudioRoom
                projects={projects}
                stageRef={stageRef}
                heroRef={heroRef}
                heroScreenRef={heroScreenRef}
                peek={peek}
                onOpenPeek={handleOpenPeek}
                onClosePeekState={handleClosePeekState}
                onSwitchToPlain={handleSwitchToPlain}
                onProgress={handleRoomProgress}
                onReady={handleRoomReady}
                onWebglFailed={markWebglFailed}
                registerActions={handleRegisterActions}
              />
            </RoomErrorBoundary>
          )}

          <div ref={heroRef} className="ln-room-hero" id="hero">
            <div ref={heroScreenRef} className="ln-room-hero__screen">
              <span className="ln-crop ln-crop--tl" aria-hidden="true" />
              <span className="ln-crop ln-crop--tr" aria-hidden="true" />
              <span className="ln-crop ln-crop--bl" aria-hidden="true" />
              <span className="ln-crop ln-crop--br" aria-hidden="true" />

              <h1>
                <NameTooltip pronunciation={siteData.say.pronunciation} meaning={siteData.say.meaning}>
                  {siteData.name}
                  <span className="ln-dot">.</span>
                </NameTooltip>
              </h1>
              <span className="ln-meta-line">{heroMeta}</span>
              <TypingTagline lines={siteData.taglines} className="ln-room-hero__lede" />
              <div className="ln-btn-row">
                <a className="ln-btn ln-btn--primary" href={`mailto:${siteData.email}`}>
                  Email me
                </a>
                <button
                  type="button"
                  id="enterRoomBtn"
                  className="ln-btn ln-btn--ink"
                  onClick={() => actionsRef.current?.enterRoom()}
                >
                  Enter the room ↓
                </button>
                <button
                  type="button"
                  className="ln-btn ln-btn--text"
                  onClick={() => actionsRef.current?.openTerminal()}
                >
                  Experience
                </button>
                <a
                  className="ln-btn ln-btn--text"
                  href={siteData.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub ↗
                </a>
                <a
                  className="ln-btn ln-btn--text"
                  href={siteData.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn ↗
                </a>
              </div>
              <CopyEmail email={siteData.email} />
            </div>
          </div>

          <RoomPeeks
            peek={peek}
            projects={projects}
            roles={siteData.experience.roles}
            aboutParagraphs={siteData.about.paragraphs}
            onClose={handleClosePeek}
            onStepProject={handleStepProject}
            onSelectProject={handleSelectProject}
            onAllProjects={handleAllProjects}
          />
        </section>
      </div>

      <main className="ln-wrap" id="aboutView" hidden={view !== "about"}>
        <section className="ln-section ln-aboutpage" id="about">
          <SectionHeader as="h1" heading={siteData.about.heading} />
          <div className="ln-about-copy">
            {siteData.about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>
      </main>

      <main id="plain" hidden={view !== "plain"}>
        <div className="ln-wrap">
          <section className="ln-plainhero" aria-label="Intro">
            <h1>
              <NameTooltip pronunciation={siteData.say.pronunciation} meaning={siteData.say.meaning}>
                {siteData.name}
                <span className="ln-dot">.</span>
              </NameTooltip>
            </h1>
            <span className="ln-meta-line">{heroMeta}</span>
            <TypingTagline lines={siteData.taglines} className="ln-plainhero__lede" />
            <div className="ln-btn-row">
              <a className="ln-btn ln-btn--primary" href={`mailto:${siteData.email}`}>
                Email me
              </a>
              <a
                className="ln-btn ln-btn--text"
                href={siteData.links.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub ↗
              </a>
              <a
                className="ln-btn ln-btn--text"
                href={siteData.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn ↗
              </a>
            </div>
            <CopyEmail email={siteData.email} />
          </section>

          <section className="ln-section" id="work">
            <SectionHeader
              heading={siteData.projects.heading}
              label={`highlighted projects · ${projects.length}`}
              action={
                <Link href="/projects" className="ln-link ln-more">
                  All projects →
                </Link>
              }
            />
            <ProjectCollage projects={projects} />
          </section>

          <section className="ln-section" id="experience">
            <SectionHeader
              heading={siteData.experience.heading}
              label={`experience · ${siteData.experience.roles.length} roles`}
            />
            <ul className="ln-list">
              {siteData.experience.roles.map((r) => (
                <ExperienceRow
                  key={`${r.org}-${r.when}`}
                  title={r.title}
                  org={r.org}
                  logo={r.logo}
                  line={r.line}
                  when={r.when}
                  where={r.where}
                  caseStudy={r.caseStudy ? roleCaseStudies[r.caseStudy] : undefined}
                />
              ))}
            </ul>
          </section>

          <section className="ln-section" id="background">
            <SectionHeader heading="Education and tools" label="background" />
            <div className="ln-school">
              {siteData.education.logo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={siteData.education.logo.light} alt={`${siteData.education.school} logo`} />
              )}
              <div className="ln-school__text">
                <span className="ln-school__name">{siteData.education.school}</span>
                <span className="ln-school__deg">{siteData.education.degree}</span>
                <span className="ln-school__deg">{siteData.education.line}</span>
              </div>
              <span className="ln-school__when">{siteData.education.when.toLowerCase()}</span>
            </div>
            <div className="ln-stack">
              {siteData.stack.groups.map((g) => (
                <div key={g.label} className="ln-stack__row">
                  <span className="ln-label">{g.label}</span>
                  <div className="ln-stack__chips">
                    {g.items.map((item) => (
                      <span key={item} className="ln-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {contactPanel}
      </main>
    </>
  );
}
