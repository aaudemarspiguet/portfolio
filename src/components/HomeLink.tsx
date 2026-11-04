"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

/** A Home action that also works when Next.js sees the same #top URL again. */
export function HomeLink({ children, className }: { children: ReactNode; className?: string }) {
  const onHome = usePathname() === "/";

  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    if (!onHome || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    if (window.location.hash !== "#top") window.history.pushState(null, "", "#top");
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  return <Link href={onHome ? "#top" : "/"} className={className} onClick={goHome}>{children}</Link>;
}
