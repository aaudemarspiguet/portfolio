"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { resetSlide, slideIn, slideOut } from "@/lib/slideCards";
import { scrollToTop } from "@/lib/phoneBars";

export type StudioView = "room" | "plain";
export type RoomNavKey = "work" | "experience" | "about";
export type PlainSectionKey = "work" | "experience" | "about";

let currentView: StudioView | null = null;
const viewListeners = new Set<() => void>();

// The site always opens in the room; plain view is one tap away on the toggle.
function readViewSnapshot(): StudioView {
  if (currentView) return currentView;
  if (typeof document !== "undefined") {
    const attr = document.documentElement.dataset.view;
    if (attr === "plain" || attr === "room") {
      currentView = attr;
      return attr;
    }
    document.documentElement.dataset.view = "room";
  }
  return "room";
}

function subscribeView(cb: () => void) {
  viewListeners.add(cb);
  return () => {
    viewListeners.delete(cb);
  };
}

function writeViewStore(next: StudioView) {
  currentView = next;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.view = next;
  }
  viewListeners.forEach((fn) => fn());
}

const noopSubscribe = () => () => {};

export type RoomHandlers = {
  nav: (key: RoomNavKey) => boolean;
  /** Zooms out of the screen into the room. */
  enterRoom: () => void;
  /** Zooms back into the screen, then runs `after`. */
  backToScreen: (after?: () => void) => void;
};

/** Two frames: long enough for React to commit a view change and the browser to lay it out. */
function afterPaint(fn: () => void) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

type StudioViewContextValue = {
  view: StudioView;
  hydrated: boolean;
  webglFailed: boolean;
  pendingSection: string | null;
  setView: (v: StudioView, section?: string | null) => void;
  setRoomCurrent: (key: RoomNavKey | null) => void;
  setPlainSection: (key: PlainSectionKey | null) => void;
  markWebglFailed: () => void;
  clearPendingSection: () => void;
  registerRoomHandlers: (handlers: RoomHandlers | null) => void;
  /** The room/plain toggle: zooms between the screen and the room and carries the section across. */
  switchView: () => void;
  /** Runs a room move the toggle asked for before the room had finished building. */
  runPendingRoomAction: () => void;
  navigateInRoom: (key: RoomNavKey) => boolean;
  goBackToScreen: () => void;
};

// The nav highlight changes on every scroll-spy hit, so it lives in its own context: only the
// navbar reads it, and the home page doesn't re-render while the reader scrolls.
type StudioNavContextValue = {
  roomCurrent: RoomNavKey | null;
  plainSection: PlainSectionKey | null;
};

const StudioViewContext = createContext<StudioViewContextValue | null>(null);
const StudioNavContext = createContext<StudioNavContextValue | null>(null);

export function StudioViewProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const view = useSyncExternalStore(subscribeView, readViewSnapshot, () => "room" as StudioView);
  const [webglFailed, setWebglFailed] = useState(false);
  const [roomCurrent, setRoomCurrentState] = useState<RoomNavKey | null>(null);
  const [plainSection, setPlainSectionState] = useState<PlainSectionKey | null>(null);
  const [pendingSection, setPendingSection] = useState<string | null>(null);
  const roomHandlersRef = useRef<RoomHandlers | null>(null);
  // The toggle reads where you are from these, so it doesn't re-render the page on every scroll.
  const roomCurrentRef = useRef<RoomNavKey | null>(null);
  const plainSectionRef = useRef<PlainSectionKey | null>(null);
  const switchingRef = useRef(false);
  // Picked in the nav while the room flies back to plain view: where plain view lands instead of
  // where the room was. `null` means the top (Home).
  const leavingToRef = useRef<{ section: RoomNavKey | null } | null>(null);
  const leavingRef = useRef(false);
  const pendingRoomActionRef = useRef<((h: RoomHandlers) => void) | null>(null);

  const setRoomCurrent = useCallback((key: RoomNavKey | null) => {
    roomCurrentRef.current = key;
    setRoomCurrentState(key);
  }, []);
  const setPlainSection = useCallback((key: PlainSectionKey | null) => {
    plainSectionRef.current = key;
    setPlainSectionState(key);
  }, []);

  const setView = useCallback(
    (next: StudioView, section?: string | null) => {
      const targetView = webglFailed && next === "room" ? "plain" : next;
      writeViewStore(targetView);

      if (targetView === "plain") {
        if (section) {
          setPendingSection(section);
          const el = document.getElementById(section);
          // Coming from the room, plain view is still hidden until React renders it, and a hidden
          // section can't be scrolled to. Then the pending section is left for HomeStudio, which
          // scrolls once plain view shows.
          if (el && el.getClientRects().length) {
            el.scrollIntoView({ behavior: "auto", block: "start" });
            setPendingSection(null);
          }
        } else {
          setPendingSection(null);
          scrollToTop();
        }
      } else {
        setPendingSection(null);
        // From the hero this changes nothing: both views rest at the same scroll (lib/phoneBars).
        scrollToTop();
        window.dispatchEvent(new Event("resize"));
      }
    },
    [webglFailed],
  );

  // Sync URL hash navigations when arriving on "/" from another route.
  useEffect(() => {
    if (!hydrated || pathname !== "/") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const id = requestAnimationFrame(() => {
      if (hash === "background") {
        setView("plain", "background");
        return;
      }
      if (hash === "about") {
        if (view === "room" && !webglFailed && roomHandlersRef.current) {
          roomHandlersRef.current.nav("about");
        } else {
          setView("plain", "about");
        }
        return;
      }
      if (hash === "work" || hash === "projects" || hash === "experience") {
        const targetId = hash === "projects" ? "work" : hash;
        if (view === "plain") {
          document.getElementById(targetId)?.scrollIntoView({ behavior: "auto", block: "start" });
        } else if (view === "room" && !webglFailed && roomHandlersRef.current) {
          roomHandlersRef.current.nav(targetId as RoomNavKey);
        }
      }
    });
    return () => cancelAnimationFrame(id);
  }, [hydrated, pathname, view, webglFailed, setView]);

  const markWebglFailed = useCallback(() => {
    setWebglFailed(true);
    writeViewStore("plain");
  }, []);

  const clearPendingSection = useCallback(() => setPendingSection(null), []);

  const registerRoomHandlers = useCallback((handlers: RoomHandlers | null) => {
    roomHandlersRef.current = handlers;
  }, []);

  const switchView = useCallback(() => {
    if (switchingRef.current) return;
    // The hero sits outside #plain (it's shared with the room), so the cards are found page-wide.
    const plainEl = document.body;

    if (readViewSnapshot() === "plain") {
      if (webglFailed) return;
      switchingRef.current = true;
      // From a section, the room flies to the same place: Projects to the canvases, About to the
      // neon sign, Experience to the terminal. From the hero, it zooms out of the screen.
      const section = plainSectionRef.current;
      const act = (h: RoomHandlers) => {
        if (section) h.nav(section);
        else h.enterRoom();
      };
      // The cards lift away first. From the top, the hero stays put: the room's screen matches it.
      const out = slideOut(plainEl, { skipHero: !section });
      void out.then(() => {
        setView("room");
        afterPaint(() => {
          resetSlide();
          const h = roomHandlersRef.current;
          if (h) act(h);
          else pendingRoomActionRef.current = act;
          switchingRef.current = false;
        });
      });
      return;
    }

    switchingRef.current = true;
    leavingRef.current = true;
    leavingToRef.current = null;
    // Read now: leaving the room clears where it was.
    const fromSection = roomCurrentRef.current;
    const root = document.documentElement;
    let watchdog = 0;
    let landed = false;
    const toPlain = () => {
      // Runs once, whether the ride finished or the watchdog gave up on it.
      if (landed) return;
      landed = true;
      window.clearTimeout(watchdog);
      const picked = leavingToRef.current;
      const section = picked ? picked.section : fromSection;
      leavingRef.current = false;
      leavingToRef.current = null;
      // Held out of sight until the cards start rising, so they never flash in place first.
      root.dataset.switch = section ? "in" : "in-below";
      setView("plain", section);
      afterPaint(() => {
        // Back at the hero, the screen already matches the page, so only what's below it rises.
        void slideIn(plainEl, { skipHero: !section });
        delete root.dataset.switch;
        switchingRef.current = false;
      });
    };
    // The ride back takes about 1.4s. If anything ever stops it from finishing, plain view still
    // comes up, so the toggle can't be left dead.
    watchdog = window.setTimeout(toPlain, 4000);
    const h = roomHandlersRef.current;
    if (h) h.backToScreen(toPlain);
    else toPlain();
  }, [setView, webglFailed]);

  const runPendingRoomAction = useCallback(() => {
    const act = pendingRoomActionRef.current;
    const h = roomHandlersRef.current;
    if (!act || !h || readViewSnapshot() !== "room") return;
    pendingRoomActionRef.current = null;
    act(h);
  }, []);

  // A section or Home picked while the toggle flies the room back to plain view: plain view
  // lands there instead of flying the camera somewhere else mid-ride.
  const navigateInRoom = useCallback((key: RoomNavKey) => {
    if (leavingRef.current) {
      leavingToRef.current = { section: key };
      return true;
    }
    if (!roomHandlersRef.current) return false;
    return roomHandlersRef.current.nav(key);
  }, []);

  const goBackToScreen = useCallback(() => {
    if (leavingRef.current) {
      leavingToRef.current = { section: null };
      return;
    }
    roomHandlersRef.current?.backToScreen();
  }, []);

  const value = useMemo(
    () => ({
      view,
      hydrated,
      webglFailed,
      pendingSection,
      setView,
      setRoomCurrent,
      setPlainSection,
      markWebglFailed,
      clearPendingSection,
      registerRoomHandlers,
      switchView,
      runPendingRoomAction,
      navigateInRoom,
      goBackToScreen,
    }),
    [
      view,
      hydrated,
      webglFailed,
      pendingSection,
      setView,
      setRoomCurrent,
      setPlainSection,
      markWebglFailed,
      clearPendingSection,
      registerRoomHandlers,
      switchView,
      runPendingRoomAction,
      navigateInRoom,
      goBackToScreen,
    ],
  );
  const nav = useMemo(() => ({ roomCurrent, plainSection }), [roomCurrent, plainSection]);

  return (
    <StudioViewContext.Provider value={value}>
      <StudioNavContext.Provider value={nav}>{children}</StudioNavContext.Provider>
    </StudioViewContext.Provider>
  );
}

export function useStudioView() {
  const ctx = useContext(StudioViewContext);
  if (!ctx) {
    throw new Error("useStudioView must be used inside StudioViewProvider");
  }
  return ctx;
}

/** Which nav item is current on the home page. Only the navbar needs it. */
export function useStudioNav() {
  const ctx = useContext(StudioNavContext);
  if (!ctx) {
    throw new Error("useStudioNav must be used inside StudioViewProvider");
  }
  return ctx;
}
