"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

/** A Home action that also works when Next.js sees the same #top URL again. */
export function HomeLink({ children, className, onClick, current }: { children: ReactNode; className?: string; onClick?: () => void; current?: boolean }) {
  const onHome = usePathname() === "/";
  const pendingHome = useRef(false);

  useEffect(() => {
    if (onHome && pendingHome.current) {
      pendingHome.current = false;
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [onHome]);

  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.();
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!onHome) {
      pendingHome.current = true;
      return;
    }

    event.preventDefault();
    if (window.location.hash !== "#top") window.history.pushState(null, "", "#top");
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return <Link href={onHome ? "#top" : "/"} scroll={false} className={className} aria-current={current ? "location" : undefined} onClick={goHome}>{children}</Link>;
}
