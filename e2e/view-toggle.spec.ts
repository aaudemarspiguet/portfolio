import { expect, test } from "@playwright/test";
import { bootDone, expectRoomDrawn, expectToggleUsable, goSection, openSite, press, switchView, view, watchErrors } from "./helpers";

// The room/plain toggle must always be there on the home page, and always work.

test("toggle survives a trip to All projects and back (plain view)", async ({ page }) => {
  const errors = watchErrors(page);
  await openSite(page);
  expect(await view(page)).toBe("room");
  await switchView(page);
  expect(await view(page)).toBe("plain");

  await press(page, 'a:has-text("All projects")');
  await page.waitForURL("**/projects");
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/");
  await bootDone(page);

  await expectToggleUsable(page);
  // And the room behind it still works.
  await switchView(page);
  expect(await view(page)).toBe("room");
  await expectRoomDrawn(page);
  expect(errors).toEqual([]);
});

test("toggle survives a trip away from the room view and back", async ({ page }) => {
  const errors = watchErrors(page);
  await openSite(page);
  await expectRoomDrawn(page);
  await page.goto("/projects");
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/");
  await bootDone(page);
  await expectToggleUsable(page);
  expect(await view(page)).toBe("room");
  await expectRoomDrawn(page);
  expect(errors).toEqual([]);
});

test("toggle survives a case study opened from inside the room", async ({ page }) => {
  const errors = watchErrors(page);
  await openSite(page);
  await goSection(page, "Projects");
  await press(page, 'a:has-text("Read the case study")');
  await page.waitForURL("**/work/**");
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/");
  await expectToggleUsable(page);
  await expectRoomDrawn(page);
  // The room starts over at its screen; going in again works.
  await goSection(page, "About");
  await expect(page.locator(".ln-peek:not([hidden]), .ln-gsheet").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("toggle survives All projects, then Home, three times over", async ({ page }) => {
  await openSite(page);
  await switchView(page);
  for (let i = 0; i < 3; i++) {
    await press(page, 'a:has-text("All projects")');
    await page.waitForURL("**/projects");
    await goSection(page, "Home");
    await page.waitForURL((u) => u.pathname === "/");
    await expectToggleUsable(page);
  }
  await switchView(page);
  await expectRoomDrawn(page);
});

test("double tap mid-switch doesn't break the toggle", async ({ page }) => {
  await openSite(page);
  await press(page, ".ln-viewswitch:visible");
  await page.waitForTimeout(120);
  await press(page, ".ln-viewswitch:visible");
  await page.waitForTimeout(3500);
  await expectToggleUsable(page);
  await switchView(page);
});
