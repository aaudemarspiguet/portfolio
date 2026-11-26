import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { bootDone, switchView } from "./helpers";

// axe-core on every page, both themes. Fails on serious and critical problems.
const pages = ["/", "/projects", "/work/find-the-outfit", "/work/saw"];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`${scheme} mode`, () => {
    test.use({ colorScheme: scheme });
    for (const path of pages) {
      test(`${path} has no serious accessibility problems`, async ({ page }) => {
        await page.goto(path);
        await bootDone(page);
        if (path === "/") await switchView(page); // plain view: the page people read
        // Contrast is checked on the page at rest: cards still fading in read as faint grey.
        await page.waitForFunction(
          () =>
            document
              .getAnimations()
              .every((a) => a.playState !== "running" || a.effect?.getTiming().iterations === Infinity),
          null,
          { timeout: 15_000 },
        );
        await page.waitForTimeout(300);
        const axe = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]);
        const { violations } = await axe.analyze();
        const bad = violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(" ") + " :: " + (n.failureSummary ?? "").split("\n").slice(1, 2).join("")) }));
        expect(bad, JSON.stringify(bad, null, 1)).toEqual([]);
      });
    }
  });
}
