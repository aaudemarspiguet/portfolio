"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { useStudioView } from "./StudioViewProvider";

/**
 * Brand link: on "/" returns to room view (if supported) and flies back to the iMac hero screen;
 * on other routes navigates to "/".
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
  const { view, webglFailed, setView, goBackToScreen } = useStudioView();
  const pendingHome = useRef(false);

  useEffect(() => {
    if (onHome && pendingHome.current) {
      pendingHome.current = false;
      if (!webglFailed && view !== "room") setView("room");
      window.scrollTo({ top: 0, behavior: "instant" });
      goBackToScreen();
    }
  }, [onHome, webglFailed, view, setView, goBackToScreen]);

  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.();
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!onHome) {
      pendingHome.current = true;
      return;
    }

    event.preventDefault();
    if (webglFailed) {
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
      return;
    }
    if (view !== "room") setView("room");
    window.scrollTo(0, 0);
    goBackToScreen();
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
