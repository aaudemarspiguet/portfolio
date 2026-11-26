import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isParked, parkContext, restoreParked } from "./glContext";

// A stand-in for a WebGL context and its WEBGL_lose_context extension. Like a browser, it sends
// "webglcontextlost" a moment after loseContext(), and refuses a restore until that event was sent.
function fakeGl(canvas: HTMLCanvasElement) {
  let lost = false;
  let lostSent = false;
  const ext = {
    loseContext: vi.fn(() => {
      lost = true;
      setTimeout(() => {
        lostSent = true;
        canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
      }, 5);
    }),
    restoreContext: vi.fn(() => {
      if (!lostSent) throw new Error("context restoration not allowed");
      setTimeout(() => {
        lost = false;
        canvas.dispatchEvent(new Event("webglcontextrestored"));
      }, 5);
    }),
  };
  const gl = { getExtension: () => ext, isContextLost: () => lost };
  return { gl, ext };
}

describe("glContext", () => {
  let canvas: HTMLCanvasElement;
  beforeEach(() => {
    vi.useFakeTimers();
    canvas = document.createElement("canvas");
  });
  afterEach(() => vi.useRealTimers());

  it("parks a context and knows it's parked", () => {
    const { gl, ext } = fakeGl(canvas);
    expect(isParked(canvas)).toBe(false);
    parkContext(canvas, gl);
    expect(ext.loseContext).toHaveBeenCalledOnce();
    expect(isParked(canvas)).toBe(true);
  });

  it("restores once the lost event has gone out", async () => {
    const { gl, ext } = fakeGl(canvas);
    parkContext(canvas, gl);
    await vi.advanceTimersByTimeAsync(10);
    const onBack = vi.fn();
    const onFail = vi.fn();
    restoreParked(canvas, onBack, onFail);
    expect(ext.restoreContext).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(10);
    expect(onBack).toHaveBeenCalledOnce();
    expect(onFail).not.toHaveBeenCalled();
    expect(isParked(canvas)).toBe(false);
  });

  // Next shows the page again for a moment while the next route loads, so the room's setup can
  // ask for the context back before the browser has sent "lost". Asking then is refused, which
  // used to mark the room broken and hide the toggle.
  it("waits for the lost event when asked to restore straight away", async () => {
    const { gl, ext } = fakeGl(canvas);
    parkContext(canvas, gl);
    const onBack = vi.fn();
    const onFail = vi.fn();
    restoreParked(canvas, onBack, onFail);
    expect(ext.restoreContext).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(20);
    expect(ext.restoreContext).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
    expect(onFail).not.toHaveBeenCalled();
  });

  it("cancels the lost event so the browser allows a restore", async () => {
    const { gl } = fakeGl(canvas);
    let cancelled = false;
    parkContext(canvas, gl);
    canvas.addEventListener("webglcontextlost", (e) => (cancelled = e.defaultPrevented));
    await vi.advanceTimersByTimeAsync(10);
    expect(cancelled).toBe(true);
  });

  it("gives up and reports a failure when the context never comes back", async () => {
    const { gl, ext } = fakeGl(canvas);
    ext.restoreContext.mockImplementation(() => {});
    parkContext(canvas, gl);
    await vi.advanceTimersByTimeAsync(10);
    const onBack = vi.fn();
    const onFail = vi.fn();
    restoreParked(canvas, onBack, onFail, 4000);
    await vi.advanceTimersByTimeAsync(4000);
    expect(onFail).toHaveBeenCalledOnce();
    expect(onBack).not.toHaveBeenCalled();
  });

  it("does nothing more once cancelled by the effect's cleanup", async () => {
    const { gl } = fakeGl(canvas);
    parkContext(canvas, gl);
    const onBack = vi.fn();
    const onFail = vi.fn();
    const stop = restoreParked(canvas, onBack, onFail);
    stop();
    await vi.advanceTimersByTimeAsync(5000);
    expect(onBack).not.toHaveBeenCalled();
    expect(onFail).not.toHaveBeenCalled();
  });

  it("calls back at once for a canvas that was never parked", () => {
    const onBack = vi.fn();
    restoreParked(canvas, onBack, vi.fn());
    expect(onBack).toHaveBeenCalledOnce();
  });
});
