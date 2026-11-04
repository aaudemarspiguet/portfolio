"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GAP = 8;

/**
 * Placement for a hover/focus tooltip that sits above its anchor. It drops
 * below when the floating nav pill leaves no room above, and anchors to the
 * right edge when it would run past the viewport (#26, #31).
 */
export function useTipPlacement<T extends HTMLElement>() {
  const root = useRef<T>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const [below, setBelow] = useState(false);
  const [end, setEnd] = useState(false);

  const place = useCallback(() => {
    if (!root.current || !tip.current) return;
    const box = root.current.getBoundingClientRect();
    const nav = document.querySelector(".ln-nav")?.getBoundingClientRect().bottom ?? 0;
    setBelow(box.top - nav < tip.current.offsetHeight + 2 * GAP);
    setEnd(box.left + tip.current.offsetWidth > document.documentElement.clientWidth - GAP);
  }, []);

  // Re-place on scroll while it is showing, since the pill stays put.
  useEffect(() => {
    const onScroll = () => {
      if (root.current?.matches(":hover, :focus")) place();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [place]);

  return { root, tip, place, below, end };
}
