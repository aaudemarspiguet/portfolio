// Small presentational pieces from the design system's "Scarlet marks" group.

export function SectionHeader({ label, heading }: { label?: string; heading: string }) {
  return (
    <header className="ln-section-head">
      <h2>{heading}</h2>
      {label && <span className="ln-label">{label}</span>}
    </header>
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
