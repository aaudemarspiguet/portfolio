"use client";

import { useId, type ReactNode } from "react";
import { useTipPlacement } from "./useTipPlacement";

/**
 * Hero name with a hover/focus/tap tooltip that says how to pronounce it.
 * It sits above the name unless that would touch the floating nav pill, as it
 * does near the top of the page on phones; then it drops below the name.
 */
export function NameTooltip({ pronunciation, meaning, children }: { pronunciation: string; meaning?: string; children: ReactNode }) {
  const { root, tip, place, below } = useTipPlacement<HTMLDivElement>();
  const tipId = useId();

  return (
    <div
      ref={root}
      className="ln-say"
      data-place={below ? "below" : undefined}
      tabIndex={0}
      aria-describedby={tipId}
      onPointerEnter={place}
      onFocus={place}
    >
      {children}
      <span ref={tip} id={tipId} role="tooltip" className="ln-say__tip">
        Say it: {pronunciation}
        {meaning && <span className="ln-say__muted"> · means “{meaning}”</span>}
      </span>
    </div>
  );
}
