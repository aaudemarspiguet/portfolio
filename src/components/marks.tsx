// Small presentational pieces from the design system's "Friendly touches"
// and "Scarlet marks" groups.

import type { ReactNode } from "react";

let wave = "M0 4 Q5 0 10 4";
for (let x = 20; x <= 200; x += 10) wave += ` T${x} 4`;

/** Scarlet hand-drawn underline under one phrase. */
export function Squiggle({ children }: { children: ReactNode }) {
  return (
    <span className="ln-squiggle">
      {children}
      <svg viewBox="0 0 200 8" preserveAspectRatio="none" aria-hidden="true">
        <path d={wave} pathLength={1} />
      </svg>
    </span>
  );
}

/** Supporting status with the glowing scarlet availability dot. */
export function Availability({ children }: { children: ReactNode }) {
  return (
    <span className="ln-live ln-label">
      <span className="ln-live__dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export function NowChip({ children }: { children: ReactNode }) {
  return (
    <span className="ln-now">
      <b>Now</b>
      {children}
    </span>
  );
}

export function SectionHeader({ label, heading }: { label?: string; heading: string }) {
  return (
    <header className="ln-section-head">
      <h2>{heading}</h2>
      {label && <span className="ln-label">{label}</span>}
    </header>
  );
}

export function Tags({ items }: { items: string[] }) {
  return (
    <div className="ln-tags">
      {items.map((t) => (
        <span key={t} className="ln-tag">{t}</span>
      ))}
    </div>
  );
}

/** A headline number. `lead` sets it in scarlet: use it once per view. */
export function Metric({ label, value, base, lead }: { label?: string; value: string; base: string; lead?: boolean }) {
  return (
    <div className={lead ? "ln-metric ln-metric--lead" : "ln-metric"}>
      {label && <span className="ln-label">{label}</span>}
      <span className="ln-metric__value">{value}</span>
      <span className="ln-metric__base">{base}</span>
    </div>
  );
}
