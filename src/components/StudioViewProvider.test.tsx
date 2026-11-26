import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/slideCards", () => ({
  slideOut: vi.fn(() => Promise.resolve()),
  slideIn: vi.fn(() => Promise.resolve()),
  resetSlide: vi.fn(),
}));
vi.mock("@/lib/phoneBars", () => ({ scrollToTop: vi.fn() }));

type Mod = typeof import("./StudioViewProvider");
type Ctx = ReturnType<Mod["useStudioView"]>;

// The view lives in a module-level store, so each test loads a fresh copy of the provider.
async function mount() {
  vi.resetModules();
  document.documentElement.removeAttribute("data-view");
  const mod: Mod = await import("./StudioViewProvider");
  const ref: { current: Ctx | null } = { current: null };
  function Probe() {
    ref.current = mod.useStudioView();
    return null;
  }
  render(
    <mod.StudioViewProvider>
      <Probe />
    </mod.StudioViewProvider>,
  );
  const handlers = { nav: vi.fn(() => true), enterRoom: vi.fn(), backToScreen: vi.fn() };
  act(() => ref.current!.registerRoomHandlers(handlers));
  return { ctx: () => ref.current!, handlers };
}

const frames = () => act(() => vi.advanceTimersByTimeAsync(100));

describe("StudioViewProvider switching", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame"] }));
  afterEach(() => vi.useRealTimers());

  it("room to plain flies back to the screen first, then shows plain view", async () => {
    const { ctx, handlers } = await mount();
    expect(ctx().view).toBe("room");
    act(() => ctx().switchView());
    expect(handlers.backToScreen).toHaveBeenCalledOnce();
    expect(ctx().view).toBe("room");
    const after = handlers.backToScreen.mock.calls[0][0] as () => void;
    act(() => after());
    await frames();
    expect(ctx().view).toBe("plain");
  });

  it("ignores a second press while the first switch is still running", async () => {
    const { ctx, handlers } = await mount();
    act(() => ctx().switchView());
    act(() => ctx().switchView());
    expect(handlers.backToScreen).toHaveBeenCalledOnce();
  });

  it("keeps the section you were in", async () => {
    const { ctx, handlers } = await mount();
    act(() => ctx().setRoomCurrent("about"));
    act(() => ctx().switchView());
    // Leaving the room clears where it was, as backToScreen does through the peek close.
    act(() => ctx().setRoomCurrent(null));
    act(() => (handlers.backToScreen.mock.calls[0][0] as () => void)());
    await frames();
    expect(ctx().view).toBe("plain");
    expect(ctx().pendingSection).toBe("about");
  });

  // Before: the camera flew off to the section, the ride back never finished, and the toggle
  // stayed dead for the rest of the visit.
  it("a section picked mid-switch lands plain view there, without moving the camera", async () => {
    const { ctx, handlers } = await mount();
    act(() => ctx().switchView());
    let handled = false;
    act(() => {
      handled = ctx().navigateInRoom("experience");
    });
    expect(handled).toBe(true);
    expect(handlers.nav).not.toHaveBeenCalled();
    act(() => (handlers.backToScreen.mock.calls[0][0] as () => void)());
    await frames();
    expect(ctx().view).toBe("plain");
    expect(ctx().pendingSection).toBe("experience");
  });

  it("Home picked mid-switch lands plain view at the top", async () => {
    const { ctx, handlers } = await mount();
    act(() => ctx().setRoomCurrent("about"));
    act(() => ctx().switchView());
    act(() => ctx().goBackToScreen());
    expect(handlers.backToScreen).toHaveBeenCalledOnce();
    act(() => (handlers.backToScreen.mock.calls[0][0] as () => void)());
    await frames();
    expect(ctx().view).toBe("plain");
    expect(ctx().pendingSection).toBe(null);
  });

  it("brings plain view up anyway if the ride back never finishes", async () => {
    const { ctx, handlers } = await mount();
    act(() => ctx().switchView());
    await act(() => vi.advanceTimersByTimeAsync(4100));
    expect(ctx().view).toBe("plain");
    // And the toggle works again.
    act(() => ctx().switchView());
    await frames();
    expect(ctx().view).toBe("room");
    // A late finish from the ride changes nothing.
    act(() => (handlers.backToScreen.mock.calls[0][0] as () => void)());
    await frames();
    expect(ctx().view).toBe("room");
  });

  it("a broken room forces plain view and the toggle stays put there", async () => {
    const { ctx } = await mount();
    act(() => ctx().markWebglFailed());
    expect(ctx().view).toBe("plain");
    expect(ctx().webglFailed).toBe(true);
    act(() => ctx().switchView());
    await frames();
    expect(ctx().view).toBe("plain");
  });
});
