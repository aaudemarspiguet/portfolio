"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  mq?.addEventListener?.("change", onChange);
  return () => mq?.removeEventListener?.("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export const TERMINAL_PROMPT = "amogh@made.dev ~ % ";

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
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(() => lines[0]?.length ?? 0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (reduced || lines.length === 0) return;
    const current = lines[index % lines.length];

    let delay = deleting ? 22 : 42;
    if (!deleting && chars === current.length) {
      delay = 2100;
    } else if (deleting && chars === 0) {
      delay = 320;
    }

    const id = setTimeout(() => {
      if (!deleting) {
        if (chars < current.length) {
          setChars((c) => c + 1);
        } else if (lines.length > 1) {
          setDeleting(true);
        }
      } else if (chars > 0) {
        setChars((c) => c - 1);
      } else {
        setDeleting(false);
        setIndex((i) => (i + 1) % lines.length);
      }
    }, delay);

    return () => clearTimeout(id);
  }, [lines, index, chars, deleting, reduced]);

  if (lines.length === 0) return null;
  const full = lines[index % lines.length];
  const visible = reduced ? lines[0] : full.slice(0, chars);

  return (
    <div className={className ? `${className} ln-typing` : "ln-typing"} aria-label={lines[0]}>
      <span aria-hidden="true" className="ln-typing__line">
        <span className="ln-typing__prompt">{TERMINAL_PROMPT}</span>
        <span className="ln-typing__cmd">{visible}</span>
        {!reduced && <span className="ln-typing__caret" />}
      </span>
    </div>
  );
}
