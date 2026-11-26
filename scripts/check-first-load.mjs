// Fails the build check when a page's first download grows past its budget or pulls in three.js.
// three.js is only for the 3D room, which loads on its own after the page is up; one stray import
// from a nav component once put all of it (about 64 KB gzipped) on every page.
// Run after `pnpm build`. Usage: pnpm check:first-load
import { readFile, stat } from "node:fs/promises";
import { gzipSync } from "node:zlib";

// Gzipped JavaScript a modern browser downloads before the page is interactive. Room chunks and the
// legacy-browser polyfills (noModule) are not counted.
const BUDGET_KB = 185;
const PAGES = ["index", "projects", "work/saw"];
const root = new URL("../.next/", import.meta.url);

let failed = false;
for (const page of PAGES) {
  const html = await readFile(new URL(`server/app/${page}.html`, root), "utf8").catch(() => null);
  if (!html) {
    console.error(`No prerendered HTML for /${page}. Run \`pnpm build\` first.`);
    process.exit(1);
  }
  const scripts = [...html.matchAll(/<script[^>]*src="\/_next\/([^"]+\.js)"[^>]*>/g)]
    .filter((m) => !/noModule/i.test(m[0]))
    .map((m) => m[1]);
  let gz = 0;
  const withThree = [];
  for (const src of new Set(scripts)) {
    const file = new URL(src, root);
    await stat(file);
    const code = await readFile(file);
    gz += gzipSync(code, { level: 9 }).length;
    if (code.includes("WebGLRenderer")) withThree.push(src);
  }
  const kb = gz / 1024;
  const name = page === "index" ? "/" : `/${page}`;
  console.log(`${name.padEnd(12)} ${kb.toFixed(1)} KB gzipped JS`);
  if (withThree.length) {
    console.error(`  three.js is in ${name}'s first download (${withThree.join(", ")}). Import it only from the room.`);
    failed = true;
  }
  if (kb > BUDGET_KB) {
    console.error(`  Over the ${BUDGET_KB} KB budget.`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
