// Small presentational pieces from the design system's "Scarlet marks" group.

import type { ReactNode } from "react";

/** A section's heading over its mono label. An `action` (a link) shares the label's row, pushed right. */
export function SectionHeader({
  heading,
  label,
  action,
  as: Heading = "h2",
  id,
}: {
  heading: string;
  label?: string;
  action?: ReactNode;
  as?: "h1" | "h2";
  id?: string;
}) {
  const labelEl = label && <span className="ln-label">{label}</span>;
  return (
    <div className="ln-section-head">
      <Heading id={id}>{heading}</Heading>
      {action ? (
        <div className="ln-section-head__sub">
          {labelEl}
          {action}
        </div>
      ) : (
        labelEl
      )}
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
