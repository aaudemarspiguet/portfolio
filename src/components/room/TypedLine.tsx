"use client";

import { useEffect, useState } from "react";

const MS_PER_CHAR = 28;

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * One line of the room tour, typed out a character at a time as if it's being said. An invisible
 * copy of the full line holds the note's size, so it doesn't grow while the text types. Screen
 * readers get the whole line at once from a live region instead of each keystroke.
 *
 * `link` names a phrase inside `text` that becomes a button once it has typed out.
 */
export function TypedLine({ text, link, onLink }: { text: string; link?: string; onLink?: () => void }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text.length : 0));

  useEffect(() => {
    if (shown >= text.length) return;
    const id = setTimeout(() => setShown((n) => n + 1), MS_PER_CHAR);
    return () => clearTimeout(id);
  }, [shown, text.length]);

  const at = link ? text.indexOf(link) : -1;
  const parts =
    at >= 0
      ? [
          { s: text.slice(0, at), link: false },
          { s: link!, link: true },
          { s: text.slice(at + link!.length), link: false },
        ]
      : [{ s: text, link: false }];

  let left = shown;
  const typed = parts.map((p, i) => {
    const visible = p.s.slice(0, Math.max(0, left));
    left -= p.s.length;
    if (!visible) return null;
    return p.link ? (
      <button key={i} type="button" className="ln-tour__link" tabIndex={-1} onClick={onLink}>
        {visible}
      </button>
    ) : (
      <span key={i}>{visible}</span>
    );
  });

  return (
    <p className="ln-tour__text">
      <span className="ln-tour__sr" aria-live="polite">
        {text}
      </span>
      <span className="ln-tour__line" aria-hidden="true">
        <span className="ln-tour__ghost">{text}</span>
        <span>
          {typed}
          {shown < text.length && <span className="ln-tour__caret" />}
        </span>
      </span>
    </p>
  );
}
