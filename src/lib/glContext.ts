// The room hands its WebGL context back whenever it stops (the cleanup in StudioRoom), so a hidden
// page doesn't hold GPU memory. With Cache Components, Next hides the home page with React's
// <Activity> when you open another route and keeps its DOM, canvas included. Coming back re-runs
// the room's setup on that same canvas, whose context was lost on purpose, and three.js can't
// start on a lost context: it threw, the room was marked broken for the rest of the visit, and the
// room/plain toggle disappeared. These helpers remember the context we dropped and bring it back.
//
// Next can also show the page again for a moment while the next route loads, so a restore may be
// asked for before the browser has even sent the "lost" event. The browser refuses a restore until
// that event has been sent and cancelled, so the restore waits for it.

type LoseContext = { loseContext(): void; restoreContext(): void };
type GL = { getExtension(name: "WEBGL_lose_context"): LoseContext | null; isContextLost(): boolean };
type Parked = { gl: GL; ext: LoseContext; lostSent: boolean };

const parked = new WeakMap<HTMLCanvasElement, Parked>();

/** Drops the canvas's context now and remembers how to bring it back. */
export function parkContext(canvas: HTMLCanvasElement, gl: GL) {
  const ext = gl.getExtension("WEBGL_lose_context");
  if (!ext) return;
  const entry: Parked = { gl, ext, lostSent: false };
  parked.set(canvas, entry);
  // A lost context may only be restored once its "lost" event was sent and cancelled.
  canvas.addEventListener(
    "webglcontextlost",
    (e) => {
      e.preventDefault();
      entry.lostSent = true;
    },
    { once: true },
  );
  ext.loseContext();
}

/** True when this canvas's context was dropped by parkContext and hasn't come back yet. */
export function isParked(canvas: HTMLCanvasElement) {
  const p = parked.get(canvas);
  return !!p && p.gl.isContextLost();
}

/**
 * Asks for the parked context back. Calls `onBack` once it's restored, or `onFail` if it doesn't
 * come back within `ms`. Returns a cancel function for an effect's cleanup.
 */
export function restoreParked(
  canvas: HTMLCanvasElement,
  onBack: () => void,
  onFail: () => void,
  ms = 4000,
): () => void {
  const p = parked.get(canvas);
  if (!p || !p.gl.isContextLost()) {
    parked.delete(canvas);
    onBack();
    return () => {};
  }
  let done = false;
  let ask = 0;
  const stop = () => {
    done = true;
    window.clearTimeout(timer);
    window.clearTimeout(ask);
    canvas.removeEventListener("webglcontextrestored", onRestored);
    canvas.removeEventListener("webglcontextlost", onLost);
  };
  const finish = (ok: boolean) => {
    if (done) return;
    stop();
    if (ok) parked.delete(canvas);
    (ok ? onBack : onFail)();
  };
  const request = () => {
    try {
      p.ext.restoreContext();
    } catch {
      // The browser refuses: the timer decides.
    }
  };
  const onRestored = () => finish(true);
  // After the page's own handler (registered first) has cancelled it, on the next task.
  const onLost = () => {
    ask = window.setTimeout(request, 0);
  };
  const timer = window.setTimeout(() => finish(!p.gl.isContextLost()), ms);
  canvas.addEventListener("webglcontextrestored", onRestored);
  if (p.lostSent) request();
  else canvas.addEventListener("webglcontextlost", onLost, { once: true });
  return stop;
}
