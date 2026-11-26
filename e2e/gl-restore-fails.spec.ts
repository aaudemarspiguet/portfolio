import { expect, test } from "@playwright/test";
import { bootDone, expectRoomDrawn, expectToggleUsable, openSite, press, switchView, view } from "./helpers";

// A slow or busy GPU may not hand the room's graphics back after another page. The room must still
// come back (on a fresh canvas), and the toggle must never disappear. Here the browser refuses
// every restore, the worst case.
test("the room comes back even when the browser won't restore its graphics", async ({ page }) => {
  await page.addInitScript(() => {
    type Proto = { getExtension(name: string): unknown };
    for (const proto of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype] as unknown as Proto[]) {
      const get = proto.getExtension;
      proto.getExtension = function (this: unknown, name: string) {
        const ext = get.call(this, name) as { loseContext(): void } | null;
        if (name === "WEBGL_lose_context" && ext) {
          return { loseContext: () => ext.loseContext(), restoreContext: () => {} };
        }
        return ext;
      };
    }
  });
  await openSite(page);
  await switchView(page);
  await press(page, 'a:has-text("All projects")');
  await page.waitForURL("**/projects");
  await page.goBack();
  await page.waitForURL((u) => u.pathname === "/");
  await bootDone(page);
  // Longer than the restore's own time limit, so a failed restore has had its say.
  await page.waitForTimeout(5000);
  await expectToggleUsable(page);
  await switchView(page);
  expect(await view(page)).toBe("room");
  await expectRoomDrawn(page);
});
