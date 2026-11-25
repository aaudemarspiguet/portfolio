// Saves the share cards as PNGs in exports/cards/, to upload by hand:
//   home-github.png      portfolio repo → Settings → Social preview
//   home-banner.png      LinkedIn profile → background photo
//   <slug>-github.png    that project's repo → Settings → Social preview
// Needs `pnpm dev` running. Usage: pnpm cards [base URL, default http://localhost:3000]
import { mkdir, writeFile } from "node:fs/promises";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const out = new URL("../exports/cards/", import.meta.url);

const list = await fetch(`${base}/cards`).catch(() => null);
if (!list?.ok) {
  console.error(`No card list at ${base}/cards. Is \`pnpm dev\` running?`);
  process.exit(1);
}

await mkdir(out, { recursive: true });
for (const name of await list.json()) {
  const res = await fetch(`${base}/cards/${name}`);
  if (!res.ok) {
    console.error(`${name}: HTTP ${res.status}`);
    process.exitCode = 1;
    continue;
  }
  await writeFile(new URL(`${name}.png`, out), Buffer.from(await res.arrayBuffer()));
  console.log(`exports/cards/${name}.png`);
}
