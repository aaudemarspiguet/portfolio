import { expect, test } from "@playwright/test";
import { expectToggleUsable, goSection, openSite, press, switchView, view } from "./helpers";

// Things people do while the camera is still moving. None of them may leave the toggle dead or
// the start screen stuck half way through its ride.

async function enterRoom(page: import("@playwright/test").Page) {
  await wheelOnHero(page);
  await expect(page.locator("#hero")).toHaveAttribute("data-gone", "true", { timeout: 15_000 });
}

// The start screen only listens for the wheel while the pointer is over it.
async function wheelOnHero(page: import("@playwright/test").Page) {
  const box = page.viewportSize()!;
  await page.mouse.move(box.width / 2, box.height / 2);
  await page.mouse.wheel(0, 500);
}

async function expectSettled(page: import("@playwright/test").Page) {
  await page.waitForTimeout(3500);
  await expect(page.locator("#hero")).not.toHaveAttribute("data-riding", "true");
  await expectToggleUsable(page);
  await switchView(page);
}

test("a section picked while the toggle flies back to the screen", async ({ page }) => {
  await openSite(page);
  await enterRoom(page);
  await press(page, ".ln-viewswitch:visible");
  await page.waitForTimeout(250);
  await goSection(page, "About");
  await expectSettled(page);
});

test("Home picked while the room flies in", async ({ page }) => {
  await openSite(page);
  await goSection(page, "Projects");
  await page.waitForTimeout(300);
  await goSection(page, "Home");
  await expectSettled(page);
});

test("toggle pressed while the room flies in", async ({ page }) => {
  await openSite(page);
  await wheelOnHero(page);
  await page.waitForTimeout(300);
  await press(page, ".ln-viewswitch:visible");
  await page.waitForTimeout(3500);
  expect(await view(page)).toBe("plain");
  await expectToggleUsable(page);
  await switchView(page);
});

test("toggle pressed twice while flying back", async ({ page }) => {
  await openSite(page);
  await enterRoom(page);
  await press(page, ".ln-viewswitch:visible");
  await page.waitForTimeout(400);
  await press(page, ".ln-viewswitch:visible");
  await expectSettled(page);
});

// "Nav buttons should always float and follow": with a sheet open, the bar above it still works.
test.describe("the bar over an open sheet", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "iphone", "sheets are the phone layout"));

  test("the section menu works while a sheet is open", async ({ page }) => {
    await openSite(page);
    await goSection(page, "Projects");
    await expect(page.locator(".ln-gsheet")).toBeVisible();
    await goSection(page, "About");
    await expect(page.locator(".ln-gsheet__title")).toHaveText(/About/);
  });

  test("the toggle works while a sheet is open", async ({ page }) => {
    await openSite(page);
    await goSection(page, "Projects");
    await expect(page.locator(".ln-gsheet")).toBeVisible();
    await expectToggleUsable(page);
    await switchView(page);
    expect(await view(page)).toBe("plain");
    await expect(page.locator(".ln-gsheet")).toHaveCount(0);
    await expectToggleUsable(page);
  });
});

// Clicks fired from inside the page, so they land mid-ride without Playwright's waits slowing them.
// Before the fix the camera flew off to the section, the switch never finished, the start screen
// stayed stuck half way and the toggle did nothing for the rest of the visit.
test.describe("a section picked a moment after the toggle", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "uses the desktop nav links"));

  for (const label of ["About", "Projects", "Experience"] as const) {
    test(`${label} lands plain view on that section`, async ({ page }) => {
      await openSite(page);
      await enterRoom(page);
      await page.waitForTimeout(2500);
      await page.evaluate(async (label) => {
        (document.querySelector(".ln-viewswitch") as HTMLElement).click();
        await new Promise((r) => setTimeout(r, 300));
        const link = [...document.querySelectorAll<HTMLElement>(".ln-nav__item")].find((a) => a.textContent?.includes(label));
        link!.click();
      }, label);
      await expect.poll(() => view(page), { timeout: 8000 }).toBe("plain");
      const id = { About: "about", Projects: "work", Experience: "experience" }[label];
      await expect
        .poll(() => page.evaluate((id) => Math.abs(document.getElementById(id)!.getBoundingClientRect().top) < 200, id), { timeout: 8000 })
        .toBe(true);
      await expectSettled(page);
    });
  }

  test("Home lands plain view at the top", async ({ page }) => {
    await openSite(page);
    await enterRoom(page);
    await page.waitForTimeout(2500);
    await page.evaluate(async () => {
      (document.querySelector(".ln-viewswitch") as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 300));
      (document.querySelector(".ln-nav__brand") as HTMLElement).click();
    });
    await expect.poll(() => view(page), { timeout: 8000 }).toBe("plain");
    expect(await page.evaluate(() => scrollY)).toBeLessThan(50);
    await expectSettled(page);
  });
});

// Before the fix plain view opened at the top: it was still hidden when it tried to scroll.
test("the toggle keeps the section: About in the room opens plain view at About", async ({ page }) => {
  await openSite(page);
  await goSection(page, "About");
  await page.waitForTimeout(3000);
  await switchView(page);
  await expect
    .poll(() => page.evaluate(() => Math.abs(document.getElementById("about")!.getBoundingClientRect().top) < 200), { timeout: 8000 })
    .toBe(true);
});
