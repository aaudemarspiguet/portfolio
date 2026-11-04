"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const GAP = 8;

/**
 * Hero name with a hover/focus/tap tooltip that says how to pronounce it.
 * It sits above the name unless that would touch the floating nav pill, as it
 * does near the top of the page on phones; then it drops below the name.
 */
export function NameTooltip({ pronunciation, meaning, children }: { pronunciation: string; meaning?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const [below, setBelow] = useState(false);

  function place() {
    if (!root.current || !tip.current) return;
    const nav = document.querySelector(".ln-nav")?.getBoundingClientRect().bottom ?? 0;
    const roomAbove = root.current.getBoundingClientRect().top - nav;
    setBelow(roomAbove < tip.current.offsetHeight + 2 * GAP);
  }

  // Re-place on scroll while it is showing, since the pill stays put.
  useEffect(() => {
    const onScroll = () => {
      if (root.current?.matches(":hover, :focus")) place();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={root}
      className="ln-say"
      data-place={below ? "below" : undefined}
      tabIndex={0}
      aria-describedby="ln-say-tip"
      onPointerEnter={place}
      onFocus={place}
    >
      {children}
      <span ref={tip} id="ln-say-tip" role="tooltip" className="ln-say__tip">
        Say it: {pronunciation}
        {meaning && <span className="ln-say__muted"> · means “{meaning}”</span>}
      </span>
    </div>
  );
}
