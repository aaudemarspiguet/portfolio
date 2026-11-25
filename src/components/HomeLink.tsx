"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { useStudioView } from "./StudioViewProvider";

/**
 * Home keeps the view you're in: in the room it flies back to the hero screen, in plain view it
 * scrolls to the top.
 */
function returnHome(inRoom: boolean, goBackToScreen: () => void, instant = false) {
  if (inRoom) {
    window.scrollTo(0, 0);
    goBackToScreen();
    return;
  }
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: instant || reduce ? "instant" : "smooth" });
}

/**
 * Going home without a link (the phone bar's pull-down menu): on "/" it returns to the hero in the
 * current view, elsewhere it navigates to "/" first.
 */
export function useGoHome() {
  const router = useRouter();
  const pathname = usePathname();
  const onHome = pathname === "/";
  const { view, webglFailed, goBackToScreen } = useStudioView();
  const pendingHome = useRef(false);

  useEffect(() => {
    if (onHome && pendingHome.current) {
      pendingHome.current = false;
      returnHome(!webglFailed && view === "room", goBackToScreen, true);
    }
  }, [onHome, webglFailed, view, goBackToScreen]);

  return useCallback(() => {
    if (!onHome) {
      pendingHome.current = true;
      router.push("/", { scroll: false });
      return;
    }
    returnHome(!webglFailed && view === "room", goBackToScreen);
  }, [onHome, router, webglFailed, view, goBackToScreen]);
}

/**
 * Brand link: on "/" returns to the hero in the current view; on other routes navigates to "/".
 */
export function HomeLink({
  children,
  className,
  onClick,
  current,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  current?: boolean;
}) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const { view, webglFailed, goBackToScreen } = useStudioView();
  const pendingHome = useRef(false);

  useEffect(() => {
    if (onHome && pendingHome.current) {
      pendingHome.current = false;
      returnHome(!webglFailed && view === "room", goBackToScreen, true);
    }
  }, [onHome, webglFailed, view, goBackToScreen]);

  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.();
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!onHome) {
      pendingHome.current = true;
      return;
    }

    event.preventDefault();
    returnHome(!webglFailed && view === "room", goBackToScreen);
  }

  return (
    <Link
      href="/"
      scroll={false}
      className={className}
      aria-current={current ? "location" : undefined}
      onClick={goHome}
    >
      {children}
    </Link>
  );
}
