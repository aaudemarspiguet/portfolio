import { expect, test, type Page } from "@playwright/test";
import { bootDone, expectToggleUsable, openSite, press, switchView } from "./helpers";

// "Nav buttons should always float and follow": on every page, in both themes, after scrolling,
// the bar's buttons are on screen, on top of everything and can be pressed.

/** Every button in the bar that's showing at this size: on screen, opaque and not covered. */
async function expectBarLive(page: Page) {
  await expect(page.locator(".ln-header")).toHaveCSS("position", "fixed");
  const controls = page.locator(".ln-header :is(a, button):visible");
  await expect.poll(() => controls.count()).toBeGreaterThan(1);
  // Polled, so a bar still fading in after the boot screen gets a moment to finish.
  const offenders = () =>
    controls.evaluateAll((els) =>
      els
        .map((el) => {
          let op = 1;
          for (let n: Element | null = el; n; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          const onTop = !!hit && (hit === el || el.contains(hit));
          const inView = r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
          return { name: el.getAttribute("aria-label") || el.textContent?.trim() || el.className, op, onTop, inView };
        })
        .filter((c) => c.op < 0.99 || !c.onTop || !c.inView),
    );
  await expect.poll(offenders).toEqual([]);
}

async function scrollDownAndBack(page: Page) {
  await page.mouse.move(10, 400);
  for (const y of [600, 3000, 99999]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(300);
    await expectBarLive(page);
  }
}

const pages = ["/projects", "/work/find-the-outfit", "/work/saw", "/work/qna", "/work/llm-ablations"];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });

    test("home, plain view, scrolled to the bottom", async ({ page }) => {
      await openSite(page);
      await expectBarLive(page);
      await switchView(page);
      await scrollDownAndBack(page);
      await expectToggleUsable(page);
    });

    for (const path of pages) {
      test(`${path} keeps the bar while scrolling`, async ({ page }) => {
        await page.goto(path);
        await bootDone(page);
        await scrollDownAndBack(page);
      });
    }
  });
}

test("deep links land with the bar live", async ({ page }) => {
  for (const hash of ["#about", "#experience", "#work", "#background"]) {
    await openSite(page, `/${hash}`);
    await page.waitForTimeout(2500);
    await expectBarLive(page);
    await expectToggleUsable(page);
  }
});

test("there and back: All projects, a case study, then the back button twice", async ({ page }) => {
  await openSite(page);
  await switchView(page);
  await page.evaluate(() => document.getElementById("work")!.scrollIntoView({ behavior: "instant" }));
  await press(page, 'a[href="/projects"]:visible');
  await expect(page).toHaveURL(/\/projects$/);
  await expectBarLive(page);
  await press(page, 'a[href^="/work/"]:visible >> nth=0');
  await expect(page).toHaveURL(/\/work\//);
  await expectBarLive(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/projects$/);
  await expectBarLive(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/$|\/#/);
  await page.waitForTimeout(1000);
  await expectBarLive(page);
  await expectToggleUsable(page);
});
