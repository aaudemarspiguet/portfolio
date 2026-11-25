"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  mq?.addEventListener?.("change", onChange);
  return () => mq?.removeEventListener?.("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export const TERMINAL_PROMPT = "amogh@made.dev ~ % ";

type TypeState = { index: number; chars: number; deleting: boolean };

/**
 * One typing loop per set of lines, shared by every copy of the tagline. The room hero and the
 * plain hero each render one, so switching views shows the same line at the same point instead of
 * starting the typing over. It only runs while some copy is on screen.
 */
class Typer {
  readonly initial: TypeState;
  private state: TypeState;
  private listeners = new Set<() => void>();
  private active = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private lines: readonly string[]) {
    this.initial = { index: 0, chars: lines[0]?.length ?? 0, deleting: false };
    this.state = this.initial;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  get = () => this.state;

  /** A copy came on screen (+1) or left it (-1). */
  setActive(delta: 1 | -1) {
    this.active += delta;
    if (this.active > 0 && !this.timer) this.schedule();
    if (this.active <= 0 && this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule() {
    const { lines } = this;
    if (lines.length === 0) return;
    const { index, chars, deleting } = this.state;
    const current = lines[index % lines.length];
    // About the pace of someone typing: a little uneven going forward, quicker backspacing.
    let delay = deleting ? 40 : 70 + Math.random() * 40;
    if (!deleting && chars === current.length) delay = 2600;
    else if (deleting && chars === 0) delay = 320;

    this.timer = setTimeout(() => {
      this.timer = null;
      const next = this.step(current);
      if (next) {
        this.state = next;
        this.listeners.forEach((l) => l());
      }
      if (this.active > 0 && next) this.schedule();
    }, delay);
  }

  private step(current: string): TypeState | null {
    const { index, chars, deleting } = this.state;
    if (!deleting) {
      if (chars < current.length) return { index, chars: chars + 1, deleting };
      return this.lines.length > 1 ? { index, chars, deleting: true } : null;
    }
    if (chars > 0) return { index, chars: chars - 1, deleting };
    return { index: (index + 1) % this.lines.length, chars: 0, deleting: false };
  }
}

const typers = new Map<string, Typer>();
function typerFor(lines: readonly string[]) {
  const key = lines.join("\n");
  let t = typers.get(key);
  if (!t) {
    t = new Typer(lines);
    typers.set(key, t);
  }
  return t;
}

/**
 * Cycles through short single-scope taglines in a compact terminal prompt
 * (type out, pause, delete, advance). Renders the first line statically
 * when prefers-reduced-motion is enabled.
 */
export function TypingTagline({
  lines,
  className,
}: {
  lines: readonly string[];
  className?: string;
}) {
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const typer = typerFor(lines);
  const { index, chars } = useSyncExternalStore(typer.subscribe, typer.get, () => typer.initial);
  // The home page keeps both heroes mounted and hides one; only a copy on screen keeps it typing.
  const rootRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !onScreen || lines.length === 0) return;
    typer.setActive(1);
    return () => typer.setActive(-1);
  }, [typer, reduced, onScreen, lines.length]);

  if (lines.length === 0) return null;
  const full = lines[index % lines.length];
  const visible = reduced ? lines[0] : full.slice(0, chars);

  return (
    <div ref={rootRef} className={className ? `${className} ln-typing` : "ln-typing"} aria-label={lines[0]}>
      <span aria-hidden="true" className="ln-typing__line">
        <span className="ln-typing__prompt">{TERMINAL_PROMPT}</span>
        <span className="ln-typing__cmd">{visible}</span>
        {!reduced && <span className="ln-typing__caret" />}
      </span>
    </div>
  );
}
