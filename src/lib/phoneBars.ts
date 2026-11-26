// iOS 26 Safari keeps the viewport between its status bar and toolbar and reports no safe-area
// insets, so measure how much screen the bars take (--bars, the screen's height less the small
// viewport's). The phone CSS puts that much page above the hero in both views (and below the room's
// stage), and the page rests scrolled down by it: the runway. In the room that's what lets the
// canvas run under both bars. In plain view it's paper. Because the hero sits at the same place on
// the page in both views and the page rests at the same scroll, switching views never scrolls.
// Only where the browser draws the page under its own bars once it's scrolled: iOS WebKit (every
// iPhone browser uses it) on a phone-width touch screen. Android Chrome and desktop have solid
// bars, so there --bars stays unset, the runway is 0 and the page rests at the top, as on main.

export function barsOn(): boolean {
  if (typeof window === "undefined") return false;
  const underBars = typeof CSS !== "undefined" && CSS.supports("-webkit-touch-callout", "none");
  return underBars && window.matchMedia("(max-width: 640px) and (pointer: coarse)").matches;
}

let probe: HTMLDivElement | null = null;
/** The small viewport's height (100svh): the viewport with Safari's toolbar showing. It doesn't
 * change when the toolbar shrinks on scroll, so the runway doesn't move under a scrolling page. */
function smallViewportHeight(): number {
  if (!probe) {
    probe = document.createElement("div");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;top:0;left:-9999px;width:1px;height:100svh;visibility:hidden;pointer-events:none";
    document.body.appendChild(probe);
  }
  return probe.offsetHeight || window.innerHeight;
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
  const bars = Math.min(screenH * 0.35, Math.max(0, Math.round(screenH - smallViewportHeight())));
  html.style.setProperty("--bars", `${bars}px`);
}

/** Where the page rests at its top: the stage's (and so the hero's) place on the page. */
export function runwayTop(stage: HTMLElement | null): number {
  if (!stage || !barsOn()) return 0;
  return Math.max(0, Math.round(stage.getBoundingClientRect().top + window.scrollY));
}

/** In the room, keeps the page scrolled so the stage's top sits at the viewport's top. */
export function holdRunway(stage: HTMLElement | null): void {
  if (!stage || !barsOn() || document.documentElement.dataset.view === "plain") return;
  if (!stage.getBoundingClientRect().height) return;
  const runway = runwayTop(stage);
  if (runway > 0 && Math.abs(window.scrollY - runway) > 0.5) window.scrollTo(0, runway);
}

/** Scrolls to the top of the page, which on iPhones is the runway, not 0. */
export function scrollToTop(behavior: ScrollBehavior = "instant"): void {
  const top = runwayTop(document.getElementById("room"));
  window.scrollTo({ top, behavior });
}
