"use client";

import dynamic from "next/dynamic";
import {
  Component,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { HomeProject } from "@/content/project-types";
import type { Role } from "@/content/site";
import { HeroIntro, type HeroData } from "./HeroIntro";
import { useStudioView, type PlainSectionKey, type RoomNavKey } from "./StudioViewProvider";
import { BootScreen } from "./BootScreen";
import { ViewportDebug } from "./room/ViewportDebug";
import { barsOn, runwayTop, scrollToTop, setBars } from "@/lib/phoneBars";
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

/**
 * The home page's client shell: the 3D room, its hero and peeks, and the switch between the
 * room and plain views. The plain view arrives pre-rendered from the server as a slot, so state
 * changes here never re-render it.
 */
export function HomeStudio({
  hero,
  projects,
  roles,
  aboutCopy,
  plainView,
}: {
  hero: HeroData;
  projects: HomeProject[];
  roles: Role[];
  aboutCopy: ReactNode;
  plainView: ReactNode;
}) {
  const {
    view,
    hydrated,
    webglFailed,
    pendingSection,
    clearPendingSection,
    setRoomCurrent,
    setPlainSection,
    markWebglFailed,
    registerRoomHandlers,
    runPendingRoomAction,
    switchView,
  } = useStudioView();

  const stageRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroScreenRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<RoomActions | null>(null);

  // Load progress goes straight to the boot screen's animation loop, so it never re-renders this tree.
  const progressRef = useRef(0);
  const [roomReady, setRoomReady] = useState(false);
  const [peek, setPeek] = useState<PeekState>(null);
  // Once built, the room stays loaded while you read the plain view, so switching back is instant
  // and the toggle can zoom straight into it. It pauses while hidden.
  const [roomBuilt, setRoomBuilt] = useState(false);
  if (hydrated && view === "room" && !webglFailed && !roomBuilt) setRoomBuilt(true);

  const handleRegisterActions = useCallback(
    (actions: RoomActions | null) => {
      actionsRef.current = actions;
      if (actions) {
        registerRoomHandlers({
          nav: actions.nav,
          enterRoom: actions.enterRoom,
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

  // The tour's "plain view" link goes the same way as the toggle: back into the screen, then the page.
  const handleSwitchToPlain = useCallback(() => {
    switchView();
  }, [switchView]);

  const handleRoomReady = useCallback(() => {
    progressRef.current = 1;
    setRoomReady(true);
    // The toggle was pressed before the room existed: make its move once the room has faded in.
    setTimeout(runPendingRoomAction, 450);
  }, [runPendingRoomAction]);

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

  // Plain view section spy: the last section whose top has passed 45% of the screen, or none
  // (Home) while you're still on the hero.
  useEffect(() => {
    if (view !== "plain") return;
    const ids: PlainSectionKey[] = ["work", "experience", "about"];
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.45;
      let current: PlainSectionKey | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setPlainSection(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [view, setPlainSection]);

  // One hero for both views: it lives in the stage, which in plain view folds down to just the hero
  // as the page's first block. Switching views only changes what's around it, so it never moves.
  // On iPhones the page rests a runway (--bars) down in both views, so switching never scrolls
  // either (lib/phoneBars). This keeps --bars measured, puts a fresh page at its runway before the
  // first paint, and keeps it there when the screen turns.
  useLayoutEffect(() => {
    setBars();
    if (barsOn() && window.scrollY < 1 && !window.location.hash) scrollToTop();
    let atTop = window.scrollY <= runwayTop(stageRef.current) + 1;
    let settleTimer = 0;
    const onResize = () => {
      setBars();
      if (atTop) scrollToTop();
    };
    // In plain view you can still scroll up into the runway's paper; once you let go, the page
    // eases back to rest at the hero, the way it rests on every other phone at 0.
    const onScroll = () => {
      const top = runwayTop(stageRef.current);
      atTop = window.scrollY <= top + 1;
      if (!barsOn() || document.documentElement.dataset.view !== "plain") return;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        if (window.scrollY < top - 0.5) window.scrollTo({ top, behavior: "smooth" });
      }, 160);
    };
    const onOrientation = () => {
      requestAnimationFrame(onResize);
      window.setTimeout(onResize, 300);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.screen.orientation?.addEventListener("change", onOrientation);
    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.screen.orientation?.removeEventListener("change", onOrientation);
    };
  }, []);

  // iOS Safari decides how to paint under its status bar (the page itself, or a solid tint taken
  // from a fixed bar touching the top) when the page scrolls. Switching views doesn't scroll, and
  // plain view's header touches the top while the room's sits below it, so coming back to the room
  // Safari kept plain view's tint as a solid bar over the room. A 1px scroll there and back, while
  // the start screen still covers everything, makes it look again.
  const lastView = useRef(view);
  useEffect(() => {
    const was = lastView.current;
    lastView.current = view;
    if (was === view || view !== "room" || !barsOn()) return;
    let back = 0;
    const there = requestAnimationFrame(() => {
      const top = runwayTop(stageRef.current);
      window.scrollTo(0, top + 1);
      back = requestAnimationFrame(() => window.scrollTo(0, top));
    });
    return () => {
      cancelAnimationFrame(there);
      cancelAnimationFrame(back);
    };
  }, [view]);

  const bootReady = view === "room" ? roomReady || webglFailed : hydrated;

  return (
    <>
      <BootScreen progress={progressRef} ready={bootReady} />
      <ViewportDebug />

      <div className="ln-wrap">
        <section ref={stageRef} className="ln-stage" id="room" aria-label={view === "room" ? "The room" : "Intro"}>
          {hydrated && roomBuilt && !webglFailed && (
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
            {/* The one hero both views share. In plain view it's the page's first block; in the room
                it's the start screen, and scrolling or swiping up zooms out of it into the room. */}
            <div ref={heroScreenRef} className="ln-room-hero__screen" tabIndex={-1}>
              <HeroIntro hero={hero} taglineClass="ln-room-hero__lede" />
            </div>
          </div>

          <RoomPeeks
            peek={peek}
            projects={projects}
            roles={roles}
            aboutCopy={aboutCopy}
            onClose={handleClosePeek}
            onStepProject={handleStepProject}
            onSelectProject={handleSelectProject}
            onAllProjects={handleAllProjects}
          />
        </section>
      </div>

      <main id="plain" hidden={view !== "plain"}>
        {plainView}
      </main>
    </>
  );
}
