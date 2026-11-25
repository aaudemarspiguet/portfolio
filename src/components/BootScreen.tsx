"use client";

import { useEffect, useRef, useState } from "react";

let sessionBooted = false;
const MIN_BOOT_MS = 1250;

/**
 * Full-viewport initial boot screen showing only the iMac monitor frame and
 * boot telemetry while the navbar, 3D room scene, textures, and fonts load
 * invisibly behind it, then cleanly dissolves into the populated workspace.
 */
export function BootScreen({
  targetProgress,
  ready,
}: {
  targetProgress: number;
  ready: boolean;
}) {
  const [displayPct, setDisplayPct] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [unmounted, setUnmounted] = useState(() => sessionBooted);

  const targetRef = useRef(targetProgress);
  const readyRef = useRef(ready);

  useEffect(() => {
    targetRef.current = targetProgress;
    readyRef.current = ready;
  }, [targetProgress, ready]);

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
      const realCap = readyRef.current ? 100 : Math.max(preMountCap, Math.min(94, targetRef.current * 100));
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
  }, [unmounted]);

  if (unmounted) return null;

  const pctPadded = String(displayPct).padStart(3, "0");
  const step = ready && displayPct >= 100 ? 3 : displayPct >= 66 ? 2 : displayPct >= 34 ? 1 : 0;

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
            <span className="ln-crop ln-crop--tl" aria-hidden="true" />
            <span className="ln-crop ln-crop--tr" aria-hidden="true" />
            <span className="ln-crop ln-crop--bl" aria-hidden="true" />
            <span className="ln-crop ln-crop--br" aria-hidden="true" />

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
          </div>
        </div>
      </div>
    </div>
  );
}
