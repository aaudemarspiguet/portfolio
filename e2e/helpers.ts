import { expect, type Page } from "@playwright/test";

/** Opens a page and waits for the boot screen to finish (the room, when it's the room view). */
export async function openSite(page: Page, path = "/") {
  await page.goto(path);
  await bootDone(page);
}

/** Waits out the boot screen (it runs again after a full page load). */
export async function bootDone(page: Page) {
  await page.waitForFunction(() => !document.documentElement.dataset.boot, null, { timeout: 90_000 });
}

export const view = (page: Page) => page.evaluate(() => document.documentElement.dataset.view);

/** The room/plain toggle that's showing at this screen size. */
export const viewToggle = (page: Page) => page.locator(".ln-viewswitch:visible");

/** Taps on touch screens, clicks elsewhere. */
export async function press(page: Page, selector: string) {
  const el = page.locator(selector).first();
  const touch = await page.evaluate(() => matchMedia("(pointer: coarse)").matches);
  if (touch) await el.tap();
  else await el.click();
}

/**
 * The toggle is really there: rendered, fully opaque, and the topmost thing where you'd tap it.
 * Nav controls float over everything, so nothing may cover them unless a sheet or menu is open.
 */
export async function expectToggleUsable(page: Page) {
  const toggle = viewToggle(page);
  await expect(toggle).toHaveCount(1);
  // Polled, so a bar still fading in after the boot screen gets a moment to finish.
  await expect
    .poll(() =>
      toggle.evaluate((b) => {
        let op = 1;
        for (let el: Element | null = b; el; el = el.parentElement) op *= Number(getComputedStyle(el).opacity);
        const r = b.getBoundingClientRect();
        const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
        return { shown: op > 0.99, onTop: !!hit && (hit === b || b.contains(hit)), inView: r.top >= 0 && r.bottom <= innerHeight };
      }),
    )
    .toEqual({ shown: true, onTop: true, inView: true });
}

/**
 * Waits until nothing on the page is mid-animation: the boot reveal, the room-to-plain switch and
 * the cards rising in (each card starts 70ms after the last, so a long page takes well over a
 * second, and longer on CI's software graphics). Endless loops like the typing cursor don't count.
 */
export async function settled(page: Page) {
  await page.waitForFunction(
    () => {
      const root = document.documentElement;
      if (root.dataset.boot || root.dataset.switch) return false;
      return document.getAnimations().every((a) => {
        const t = a.effect?.getComputedTiming();
        return a.playState !== "running" || !t || t.iterations === Infinity;
      });
    },
    null,
    { timeout: 15_000 },
  );
}

/** Presses the toggle and waits for the view to change. */
export async function switchView(page: Page) {
  const before = await view(page);
  await press(page, ".ln-viewswitch:visible");
  await expect.poll(() => view(page), { timeout: 10_000 }).not.toBe(before);
}

/** The room drew something: a screenshot of the canvas isn't one flat colour. */
export async function expectRoomDrawn(page: Page) {
  const canvas = page.locator("#scene");
  await expect(canvas).toHaveCount(1);
  await expect
    .poll(
      async () => {
        const png = (await canvas.screenshot()).toString("base64");
        return page.evaluate(async (b64) => {
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          await img.decode();
          const probe = document.createElement("canvas");
          probe.width = 24;
          probe.height = 24;
          const ctx = probe.getContext("2d")!;
          ctx.drawImage(img, 0, 0, 24, 24);
          const d = ctx.getImageData(0, 0, 24, 24).data;
          const seen = new Set<string>();
          for (let i = 0; i < d.length; i += 4) seen.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`);
          return seen.size;
        }, png);
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThan(8);
}

/** Collects uncaught errors and console errors so a test can assert there were none. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

/** Goes to a section with the nav: the phone bar's pull-down, or the desktop pill's links. */
export async function goSection(page: Page, label: "Home" | "Projects" | "Experience" | "About") {
  if (await page.locator(".ln-mbar__title").isVisible()) {
    await press(page, ".ln-mbar__title");
    await press(page, `[role=menu] [role^=menuitem]:has-text("${label}")`);
  } else if (label === "Home") {
    await press(page, ".ln-nav__brand");
  } else {
    await press(page, `.ln-nav__item:has-text("${label}")`);
  }
}
