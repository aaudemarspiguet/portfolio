import { expect, test, type Page } from "@playwright/test";
import { bootDone, expectToggleUsable, openSite, press, switchView } from "./helpers";

// "Nav buttons should always float and follow": on every page, in both themes, after scrolling,
// the bar's buttons are on screen, on top of everything and can be pressed.

/** Every button in the bar that's showing at this size: on screen, opaque and not covered. */
async function expectBarLive(page: Page) {
  await expect(page.locator(".ln-header")).toHaveCSS("position", "fixed");
  const controls = page.locator(".ln-header :is(a, button):visible");
  await expect.poll(() => controls.count()).toBeGreaterThan(1);
  // Polled: right after the boot screen the bar is still fading in for a moment.
  await expect
    .poll(() =>
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
      ),
    )
    .toEqual([]);
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
        await expectToggleUsable(page);
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

/** Where the section's top sits on screen, in plain view. */
const sectionTop = (page: Page, id: string) =>
  page.evaluate((id) => document.getElementById(id)!.getBoundingClientRect().top, id);

/** The nav item marked as the one you're in (Projects, Experience, About), or "" for none. */
const currentNav = (page: Page) =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll(".ln-header [aria-current='true'], .ln-mbar__title")].find(
      (n) => (n as HTMLElement).offsetParent !== null,
    );
    return el?.textContent?.trim() ?? "";
  });

test("the toggle on All projects takes you home in the other view, at Projects", async ({ page }) => {
  // Plain view first, then the page's own link to All projects (no reload).
  await openSite(page);
  await switchView(page);
  expect(await page.evaluate(() => document.documentElement.dataset.view)).toBe("plain");
  await page.evaluate(() => document.getElementById("work")!.scrollIntoView({ behavior: "instant" }));
  await press(page, 'a[href="/projects"]:visible');
  await expect(page).toHaveURL(/\/projects$/);
  await expectToggleUsable(page);

  // Plain to room: home, in the room, flying to the projects.
  await press(page, ".ln-viewswitch:visible");
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.view)).toBe("room");
  await expect.poll(() => currentNav(page), { timeout: 20_000 }).toContain("Projects");
  await expectToggleUsable(page);
});

test("the toggle on a case study takes you home in the other view, at its section", async ({ page }) => {
  // Opened straight from a link, in the room (the site opens in the room).
  await openSite(page, "/work/saw");
  await expectToggleUsable(page);
  await expect(page.locator(".ln-viewswitch:visible")).toHaveAttribute("data-view", "room");

  // Room to plain: home, in plain view, scrolled to Projects. Home hasn't been shown in this visit
  // yet, so its boot screen runs first, as it does for the brand link.
  await press(page, ".ln-viewswitch:visible");
  await expect(page).toHaveURL(/\/$/);
  await bootDone(page);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.view)).toBe("plain");
  await expect.poll(() => sectionTop(page, "work").then((t) => Math.abs(t) < 120), { timeout: 10_000 }).toBe(true);
  await expectBarLive(page);
  await expectToggleUsable(page);
});
