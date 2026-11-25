// The plain view's cards and sections slide in and out when the view changes, the way amjeff.com's
// cards rise on first load: each block fades up from below, one after another, and headings come
// up out of a line mask. Only the blocks on screen move, so the stagger stays short wherever you are.

const BLOCKS = [
  ".ln-plainhero > *",
  ".ln-section-head",
  ".ln-piece",
  ".ln-list__row",
  ".ln-about-copy > p",
  ".ln-about-bg__heading",
  ".ln-school",
  ".ln-stack__row",
  ".ln-panel",
].join(",");

const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN = "cubic-bezier(0.55, 0, 0.75, 0.2)";
const MAX_BLOCKS = 14;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
}

function onScreenBlocks(root: HTMLElement, skipHero = false) {
  const h = window.innerHeight;
  const out: HTMLElement[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(BLOCKS)) {
    if (skipHero && el.closest(".ln-plainhero")) continue;
    const r = el.getBoundingClientRect();
    if (r.height === 0 || r.bottom <= 0 || r.top >= h) continue;
    out.push(el);
    if (out.length >= MAX_BLOCKS) break;
  }
  return out;
}

const running = new Set<Animation>();

function clearRunning() {
  running.forEach((a) => a.cancel());
  running.clear();
}

/** Cards rise into place one after another. Resolves when the last one lands. */
export function slideIn(root: HTMLElement | null, opts?: { skipHero?: boolean }): Promise<void> {
  clearRunning();
  if (!root || prefersReducedMotion() || typeof root.animate !== "function") return Promise.resolve();
  const blocks = onScreenBlocks(root, opts?.skipHero);
  const done = blocks.map((el, i) => {
    const heading = el.classList.contains("ln-section-head") || el.classList.contains("ln-about-bg__heading");
    // `translate` leaves each card's own transform (the collage tilt, hover lifts) alone.
    const frames: Keyframe[] = heading
      ? [
          { opacity: 0, translate: "0 0.9em", clipPath: "inset(0 0 100% 0)" },
          { opacity: 1, translate: "0 0", clipPath: "inset(0 0 0% 0)" },
        ]
      : [
          { opacity: 0, translate: "0 40px" },
          { opacity: 1, translate: "0 0" },
        ];
    const a = el.animate(frames, { duration: 760, delay: i * 70, easing: EASE_OUT, fill: "backwards" });
    running.add(a);
    return a.finished
      .catch(() => undefined)
      .finally(() => running.delete(a));
  });
  return Promise.all(done).then(() => undefined);
}

/**
 * Cards lift away, last one first. Resolves when they're gone; they stay hidden until `slideIn`
 * or `resetSlide` runs, so the swap to the room never flashes them back.
 */
export function slideOut(root: HTMLElement | null, opts?: { skipHero?: boolean }): Promise<void> {
  clearRunning();
  if (!root || prefersReducedMotion() || typeof root.animate !== "function") return Promise.resolve();
  const blocks = onScreenBlocks(root, opts?.skipHero).reverse();
  const done = blocks.map((el, i) => {
    const a = el.animate(
      [
        { opacity: 1, translate: "0 0" },
        { opacity: 0, translate: "0 -28px" },
      ],
      { duration: 300, delay: i * 30, easing: EASE_IN, fill: "forwards" },
    );
    running.add(a);
    return a.finished.catch(() => undefined);
  });
  return Promise.all(done).then(() => undefined);
}

/** Drops any held slide-out, so the cards are back in place. */
export function resetSlide() {
  clearRunning();
}
