"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
  type ReactNode,
  type UIEvent,
} from "react";

/** Visible heights (px) the sheet rests at, smallest first. `max` is the tallest it can be. */
export type DetentFn = (viewportHeight: number, max: number) => number[];

/** Medium (a little over half the screen) and large (just under the top bar). */
export const MEDIUM_LARGE: DetentFn = (vh, max) => [Math.min(max, Math.round(vh * 0.55)), max];

const CLOSE_MS = 240;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A phone sheet in the iOS style: it rises from the bottom, rests at detents, and is dragged by its
 * header. Close (×) sits in the top-left corner. Dragging below the smallest detent, or tapping the
 * dimmed room behind it, closes it.
 */
export function Sheet({
  title,
  titleId,
  onClose,
  detents = MEDIUM_LARGE,
  initial = 0,
  snap,
  eyebrow,
  headerEnd,
  footer,
  className = "",
  escape = false,
  children,
}: {
  title: string;
  titleId?: string;
  onClose: () => void;
  detents?: DetentFn;
  /** Index of the detent it opens at. */
  initial?: number;
  /** Move the sheet to `index`; a new `id` asks again even for the same detent. */
  snap?: { index: number; id: number };
  /** A small line above the title, like "1 of 4". */
  eyebrow?: ReactNode;
  headerEnd?: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Close on Escape. Off when the owner already handles Escape. */
  escape?: boolean;
  children: ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [rests, setRests] = useState<number[]>([]);
  const [max, setMax] = useState(0);
  const [visible, setVisible] = useState(0);
  const [index, setIndex] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const closingRef = useRef(false);
  const drag = useRef<{ id: number; startY: number; startV: number; lastY: number; lastT: number; vel: number } | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Measure: the tallest the sheet may be comes from CSS (it clears the top bar and the notch).
  const measure = useCallback(() => {
    const el = sheetRef.current;
    if (!el) return null;
    const cap = parseFloat(getComputedStyle(el).maxHeight) || window.innerHeight * 0.9;
    const list = detents(window.innerHeight, cap).map((h) => Math.min(cap, Math.max(0, h)));
    setMax(cap);
    setRests(list);
    return list;
  }, [detents]);

  // Open: start below the screen, then rise to the first detent on the next frame.
  useLayoutEffect(() => {
    const list = measure();
    if (!list) return;
    const target = list[Math.min(initial, list.length - 1)];
    // With reduced motion the CSS drops the transition, so this lands without animating.
    const id = requestAnimationFrame(() => setVisible(target));
    return () => cancelAnimationFrame(id);
    // Opening runs once; later detent changes go through `snap`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => {
      const list = measure();
      if (!list || closingRef.current) return;
      setIndex((i) => {
        const clamped = Math.min(i, list.length - 1);
        setVisible(list[clamped]);
        return clamped;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  const goTo = useCallback(
    (i: number) => {
      if (!rests.length) return;
      const clamped = Math.max(0, Math.min(i, rests.length - 1));
      setIndex(clamped);
      setVisible(rests[clamped]);
    },
    [rests],
  );

  useEffect(() => {
    if (!snap) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- an outside request to move.
    goTo(snap.index);
  }, [snap, goTo]);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    if (prefersReducedMotion()) {
      onCloseRef.current();
      return;
    }
    setVisible(0);
    window.setTimeout(() => onCloseRef.current(), CLOSE_MS);
  }, []);

  useEffect(() => {
    if (!escape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [escape, close]);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button, a, input, [role='tab']")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, startY: e.clientY, startV: visible, lastY: e.clientY, lastT: e.timeStamp, vel: 0 };
    setDragging(true);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    // Upward is positive: the sheet grows.
    d.vel = 0.8 * ((d.lastY - e.clientY) / dt) + 0.2 * d.vel;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    const raw = d.startV + (d.startY - e.clientY);
    // Past the top it resists, like iOS.
    const next = raw > max ? max + (raw - max) * 0.15 : Math.max(0, raw);
    setVisible(next);
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    const smallest = rests[0] ?? 0;
    const v = Math.min(visible, max);
    if (v < smallest - 72 || (d.vel < -0.6 && v < smallest + 24)) {
      close();
      return;
    }
    const projected = v + d.vel * 180;
    let best = 0;
    rests.forEach((h, i) => {
      if (Math.abs(h - projected) < Math.abs(rests[best] - projected)) best = i;
    });
    goTo(best);
  }

  // Grow the sheet when the reader starts scrolling its body, as iOS does.
  function onBodyScroll(e: UIEvent<HTMLDivElement>) {
    if (dragging || index >= rests.length - 1) return;
    if (e.currentTarget.scrollTop > 4) goTo(rests.length - 1);
  }

  useEffect(() => {
    sheetRef.current?.querySelector<HTMLElement>("[data-close]")?.focus({ preventScroll: true });
  }, []);

  // Below the smallest detent the sheet slides down at that height instead of shrinking, so its
  // footer never squashes while it closes.
  const smallest = rests[0] ?? 0;
  const height = Math.max(visible, smallest);
  const shift = Math.max(0, smallest - visible);
  // The sheet floats above the bottom edge, so closing also carries it down past that gap.
  const gapShare = smallest ? shift / smallest : 0;
  // Clear glass at the smaller detents, solid once pulled to the top.
  const solid = max > smallest ? Math.min(1, Math.max(0, (visible - smallest) / (max - smallest))) : 0;
  const scrim = max ? Math.min(1, visible / max) : 0;

  return (
    <div className="ln-gsheet-layer">
      <div className="ln-gsheet__scrim" style={{ opacity: scrim }} onClick={close} aria-hidden="true" />
      <div
        ref={sheetRef}
        className={`ln-gsheet ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={titleId ? undefined : title}
        data-dragging={dragging ? "" : undefined}
        style={
          {
            height: rests.length ? height : undefined,
            "--gsheet-solid": solid,
            transform: `translateY(calc(${shift}px + ${gapShare} * var(--gsheet-gap, 0px)))`,
          } as CSSProperties
        }
      >
        <div
          className="ln-gsheet__head"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="ln-gsheet__grab" aria-hidden="true" />
          <button type="button" className="ln-gbtn ln-gsheet__x" data-close aria-label="Close" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="ln-gsheet__titles">
            {eyebrow && <span className="ln-gsheet__eyebrow">{eyebrow}</span>}
            <h2 id={titleId} className="ln-gsheet__title">
              {title}
            </h2>
          </div>
          <div className="ln-gsheet__end">{headerEnd}</div>
        </div>
        <div className="ln-gsheet__body" onScroll={onBodyScroll}>
          {children}
        </div>
        {footer && <div className="ln-gsheet__foot">{footer}</div>}
      </div>
    </div>
  );
}
