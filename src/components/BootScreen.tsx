"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { clockLabel, dateLabel } from "@/lib/clock";

let sessionBooted = false;
const MIN_BOOT_MS = 1250;
const noopSubscribe = () => () => {};

/**
 * Full-viewport initial boot screen shown while the navbar, 3D room scene, textures, and fonts
 * load invisibly behind it, then dissolves into the workspace. Wide stages show the iMac's boot
 * telemetry; portrait stages (phones) show the desk phone's lock screen instead.
 */
export function BootScreen({
  progress,
  ready,
}: {
  /** Real load progress (0 to 1), read on each animation frame. */
  progress: RefObject<number>;
  ready: boolean;
}) {
  const [displayPct, setDisplayPct] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [unmounted, setUnmounted] = useState(() => sessionBooted);
  // Client-only snapshots so the server render (empty) never disagrees about the date or time.
  const today = useSyncExternalStore(noopSubscribe, dateLabel, () => "");
  const now = useSyncExternalStore(noopSubscribe, clockLabel, () => "");

  const readyRef = useRef(ready);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    if (unmounted || typeof window === "undefined") return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    document.documentElement.dataset.boot = "loading";
    let raf = 0;
    let exitTimer: ReturnType<typeof setTimeout> | null = null;
    let unmountTimer: ReturnType<typeof setTimeout> | null = null;
    let cur = 0;
    const t0 = performance.now();

    const tick = (now: number) => {
      if (reduced && readyRef.current) {
        sessionBooted = true;
        delete document.documentElement.dataset.boot;
        setDisplayPct(100);
        setExiting(true);
        setUnmounted(true);
        return;
      }

      const elapsed = now - t0;
      const timeFraction = Math.min(1, elapsed / MIN_BOOT_MS);
      // Smooth nonlinear cadence with gentle micro-steps so each boot phase reads clearly.
      const baseCurve = (1 - Math.pow(1 - timeFraction, 1.55)) * 100;
      const wobble = Math.sin(timeFraction * Math.PI * 5) * 2.2 * (1 - timeFraction);
      const pacedCeiling = Math.min(100, Math.max(2, baseCurve + wobble));

      const preMountCap = 38 * (1 - Math.exp(-elapsed / 420));
      const realCap = readyRef.current ? 100 : Math.max(preMountCap, Math.min(94, progress.current * 100));
      const desired = Math.min(pacedCeiling, realCap);

      // Keep progression strictly monotonic so numbers never tick backward.
      cur = Math.max(cur, cur + (desired - cur) * 0.16);
      if (readyRef.current && timeFraction >= 1 && 100 - cur < 0.8) cur = 100;

      const rounded = Math.round(cur);
      setDisplayPct(rounded);

      if (readyRef.current && rounded >= 100 && timeFraction >= 1) {
        sessionBooted = true;
        exitTimer = setTimeout(() => {
          document.documentElement.dataset.boot = "revealing";
          setExiting(true);
          unmountTimer = setTimeout(() => {
            delete document.documentElement.dataset.boot;
            setUnmounted(true);
          }, 820);
        }, 160);
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (exitTimer) clearTimeout(exitTimer);
      if (unmountTimer) clearTimeout(unmountTimer);
      delete document.documentElement.dataset.boot;
    };
  }, [unmounted, progress]);

  if (unmounted) return null;

  const pctPadded = String(displayPct).padStart(3, "0");
  const step = ready && displayPct >= 100 ? 3 : displayPct >= 66 ? 2 : displayPct >= 34 ? 1 : 0;
  const stepLabel = ["waking up", "mounting studio loft", "lighting the room", "ready"][step];

  return (
    <div
      className={exiting ? "ln-boot is-exiting" : "ln-boot"}
      role="status"
      aria-live="polite"
      aria-label={`Booting studio loft, ${displayPct}%`}
    >
      <div className="ln-wrap ln-boot__wrap">
        <div className="ln-boot__stage">
          <div className="ln-boot__screen">

            <div className="ln-boot__console">
              <div className="ln-boot__top">
                <span className="ln-boot__id">
                  <span className="ln-boot__dot" aria-hidden="true" />
                  amogh@made.dev
                </span>
                <span className="ln-boot__pct">{pctPadded}</span>
              </div>

              <div className="ln-boot__bar" aria-hidden="true">
                <span
                  className="ln-boot__fill"
                  style={{ transform: `scaleX(${displayPct / 100})` }}
                />
              </div>

              <ul className="ln-boot__steps">
                <li className={step === 0 ? "is-active" : "is-done"}>
                  <span>&gt;</span> init workspace
                </li>
                <li className={step === 1 ? "is-active" : step > 1 ? "is-done" : ""}>
                  <span>&gt;</span> mount studio loft
                </li>
                <li className={step === 2 ? "is-active" : step > 2 ? "is-done" : ""}>
                  <span>&gt;</span> render lighting &amp; textures
                </li>
              </ul>
            </div>

            {/* Portrait stages (phones) wake the desk phone instead: a lock screen, then the hero. */}
            <div className="ln-boot__lock" aria-hidden="true">
              <span className="ln-boot__date">{today}</span>
              <span className="ln-boot__clock">{now}</span>
              <div className="ln-boot__lockfoot">
                <span className="ln-boot__lockbar">
                  <span className="ln-boot__fill" style={{ transform: `scaleX(${displayPct / 100})` }} />
                </span>
                <span className="ln-boot__lockstep">{stepLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
