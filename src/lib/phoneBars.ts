// iOS 26 Safari keeps the viewport between its status bar and toolbar and reports no safe-area
// insets, so measure how much screen the bars take (--bars, the screen's height less the
// viewport's). The phone CSS gives the room's stage that much page above and below and runs the
// canvas under both bars; keeping the page scrolled down by it (the runway) puts the stage exactly
// in the viewport, with real room above it under the status bar and below it under the toolbar.
// Only where the browser draws the page under its own bars once it's scrolled: iOS WebKit (every
// iPhone browser uses it) on a phone-width touch screen. Android Chrome and desktop have solid
// bars, so there --bars stays unset and the stage is a plain 100svh.

export function barsOn(): boolean {
  if (typeof window === "undefined") return false;
  const underBars = typeof CSS !== "undefined" && CSS.supports("-webkit-touch-callout", "none");
  return underBars && window.matchMedia("(max-width: 640px) and (pointer: coarse)").matches;
}

export function setBars(): void {
  const html = document.documentElement;
  if (!barsOn()) {
    html.style.removeProperty("--bars");
    return;
  }
  // iOS keeps screen.width and height in portrait, so pick the side that matches the window.
  const portrait = window.innerHeight >= window.innerWidth;
  const screenH = portrait
    ? Math.max(window.screen.width, window.screen.height)
    : Math.min(window.screen.width, window.screen.height);
  // A sanity cap, as a share of the screen, so a stale reading mid-rotation can't add a huge gap.
  const bars = Math.min(screenH * 0.35, Math.max(0, Math.round(screenH - window.innerHeight)));
  html.style.setProperty("--bars", `${bars}px`);
}

/** Scrolls the page so the stage's top sits at the viewport's top. */
export function holdRunway(stage: HTMLElement | null): void {
  if (!stage || !barsOn()) return;
  const r = stage.getBoundingClientRect();
  if (!r.height) return;
  const runway = Math.round(r.top + window.scrollY);
  if (runway > 0 && Math.abs(window.scrollY - runway) > 0.5) window.scrollTo(0, runway);
}
