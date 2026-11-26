import { expect, test, type Page } from "@playwright/test";
import { bootDone, openSite, watchErrors } from "./helpers";

// Random taps, swipes, menus, rotations and back presses, fast and slow, from a fixed seed so a
// failure can be replayed. Afterwards the toggle must still be there, on top, and still switch.
// CI runs two seeds of 20 steps; run more with MONKEY_SEEDS=1-50 pnpm test:e2e e2e/monkey.spec.ts.
function seeds(): number[] {
  const spec = process.env.MONKEY_SEEDS ?? "1-2";
  const [a, b] = spec.split("-").map(Number);
  return Array.from({ length: (b ?? a) - a + 1 }, (_, i) => a + i);
}
const STEPS = Number(process.env.MONKEY_STEPS ?? 20);

function monkey(page: Page, seed: number, phone: boolean) {
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
  async function hit(sel: string) {
    const l = page.locator(sel).first();
    if (!(await l.count()) || !(await l.isVisible().catch(() => false))) return;
    if (phone) await l.tap({ timeout: 1500 }).catch(() => {});
    else await l.click({ timeout: 1500 }).catch(() => {});
  }
  const toggle = ".ln-viewswitch:visible";
  const actions: Record<string, () => Promise<unknown>> = {
    toggle: () => hit(toggle),
    doubleToggle: async () => {
      await hit(toggle);
      await page.waitForTimeout(80 + rnd() * 400);
      await hit(toggle);
    },
    swipe: async () => {
      const v = page.viewportSize()!;
      await page.mouse.move(v.width / 2, v.height / 2);
      await page.mouse.wheel(0, 300 + rnd() * 400);
    },
    swipeBack: () => page.mouse.wheel(0, -400),
    section: async () => {
      if (await page.locator(".ln-mbar__title").isVisible()) {
        await hit(".ln-mbar__title");
        await page.waitForTimeout(250);
        await hit(`[role=menu] [role^=menuitem]:has-text("${pick(["Home", "Projects", "Experience", "About"])}")`);
      } else await hit(`.ln-nav__item:has-text("${pick(["Projects", "Experience", "About"])}")`);
    },
    more: async () => {
      await hit('button[aria-label="More"]');
      await page.waitForTimeout(250);
      await hit(`[role=menu] [role^=menuitem]:has-text("${pick(["Tour", "Record Player", "Sound", "Dark", "Light", "Copy Email"])}")`);
    },
    escape: () => page.keyboard.press("Escape"),
    tapScene: async () => {
      const v = page.viewportSize()!;
      const x = 20 + rnd() * (v.width - 40);
      const y = 120 + rnd() * (v.height - 200);
      if (phone) await page.touchscreen.tap(x, y);
      else await page.mouse.click(x, y);
    },
    tour: () => hit(pick(['button:has-text("Next")', 'button:has-text("Skip")'])),
    close: () => hit('[data-close], button[aria-label="Close"]'),
    rotate: async () => {
      const v = page.viewportSize()!;
      await page.setViewportSize({ width: v.height, height: v.width });
    },
    hash: () => page.evaluate((h) => (location.hash = h), pick(["#work", "#experience", "#about", ""])),
    back: () => page.goBack({ timeout: 3000 }).catch(() => {}),
    pause: () => page.waitForTimeout(rnd() * 1500),
  };
  const names = Object.keys(actions);
  return { rnd, step: async () => {
    const name = pick(names);
    await actions[name]();
    return name;
  } };
}

for (const seed of seeds()) {
  test(`random use, seed ${seed}`, async ({ page }, info) => {
    test.setTimeout(STEPS * 12_000 + 120_000);
    const errors = watchErrors(page);
    const phone = info.project.name === "iphone";
    await openSite(page);
    const m = monkey(page, seed, phone);
    const trail: string[] = [];
    for (let i = 0; i < STEPS; i++) {
      trail.push(await m.step());
      await page.waitForTimeout(m.rnd() < 0.5 ? 120 : 2600);
      // Left the home page (a project, All projects, an outside link): come back the way people do.
      if (new URL(page.url()).pathname !== "/" || !page.url().startsWith(info.project.use.baseURL ?? "http://localhost")) {
        trail.push("(back home)");
        await openSite(page);
      }
    }
    info.annotations.push({ type: "trail", description: trail.join(" > ") });
    // Settle: close whatever is open, let any ride finish.
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(3500);
    await bootDone(page);

    const toggle = page.locator(".ln-viewswitch:visible");
    await expect(toggle, `toggle missing after: ${trail.join(" > ")}`).toHaveCount(1);
    const before = await page.evaluate(() => document.documentElement.dataset.view);
    if (phone) await toggle.tap();
    else await toggle.click();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.view), { timeout: 10_000, message: `toggle dead after: ${trail.join(" > ")}` })
      .not.toBe(before);
    expect(errors.filter((e) => !e.includes("PCFSoftShadowMap")), trail.join(" > ")).toEqual([]);
  });
}
