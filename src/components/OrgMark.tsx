"use client";

import type { Logo } from "@/content/site";
import { useTipPlacement } from "./useTipPlacement";

/**
 * Text-height org logo that sits inline after a role title. Hover, focus or a
 * tap shows the org's full name in the same pill tooltip as the hero name (#31).
 */
export function OrgMark({ org, logo }: { org: string; logo: Logo }) {
  const { root, tip, place, below, end } = useTipPlacement<HTMLSpanElement>();

  return (
    <span
      ref={root}
      className="ln-say ln-org"
      data-place={below ? "below" : undefined}
      data-align={end ? "end" : undefined}
      role="img"
      aria-label={org}
      tabIndex={0}
      onPointerEnter={place}
      onFocus={place}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static marks, no optimization needed */}
      <img src={logo.light} alt="" width={20} height={20} className={logo.dark ? "ln-org__light" : undefined} />
      {logo.dark && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.dark} alt="" width={20} height={20} className="ln-org__dark" />
      )}
      <span ref={tip} aria-hidden="true" className="ln-say__tip">{org}</span>
    </span>
  );
}
