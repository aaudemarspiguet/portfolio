"use client";

import { useEffect, useSyncExternalStore } from "react";
import { initGlobalSfx, toggleSfx, useSfxEnabled } from "@/lib/sfx";

const noopSubscribe = () => () => {};

/**
 * Installs delegated click SFX once and renders a compact sound toggle in the nav bar.
 */
export function SfxToggle() {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const stored = useSfxEnabled();
  const enabled = hydrated ? stored : true;

  useEffect(() => initGlobalSfx(), []);

  return (
    <button
      type="button"
      className="ln-icon-btn"
      data-sfx-toggle="true"
      aria-pressed={enabled}
      aria-label={enabled ? "Mute click sound effects" : "Enable click sound effects"}
      title={enabled ? "Sound effects on" : "Sound effects muted"}
      onClick={toggleSfx}
    >
      {enabled ? (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4V5z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4V5z" />
          <path d="m21 9-6 6M15 9l6 6" />
        </svg>
      )}
    </button>
  );
}
