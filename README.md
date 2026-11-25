# Portfolio

Personal site for a software engineer working on applied AI and data. Built with Next.js and deployed on Vercel.

Live at https://amoghmade.dev.

## Run it

This repo uses pnpm (the version is pinned in `package.json`). With Node 22, `corepack enable` sets it up.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

| Script | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Generate route types, then run `tsc` |
| `pnpm build` | Build for production |

## Where things live

- `src/content/site.ts`: home page copy (name, links, experience roles, education, about, stack, contact).
- `src/content/projects.ts`: case studies. `kind: "project"` entries are the home page cards; `kind: "work"` entries are linked from their experience row.
- `src/content/placeholder.ts`: the template-mode marker. `grep -rn "placeholder(" src/content` lists copy still to be written. The pre-template copy is at git tag `copy-v1`.
- `src/styles/tokens.css`: design tokens (color, shadow, type, spacing, radius) for light and dark.
- `src/styles/components.css`: the `.ln-*` component styles.
- `src/components/`: React components. Only the nav, theme toggle, copy-email button and clock run on the client.

To change copy, edit the two files in `src/content/`. Each case study has a cover and can have an optional diagram and optional live or repo links.

## Media

Static media lives in `public/` and ships with each deploy, served from Vercel's CDN. It is about 18 MB, most of it the three record tracks.

- **Audio.** Run new sounds through `scripts/encode-audio.sh` (needs ffmpeg). It brings them to -16 LUFS with true peaks under -1.1 dBTP and writes 256 kbps AAC with `+faststart`, so every clip plays at the same level and starts before it has fully downloaded. Don't put ALAC or WAV in `public/audio/`: Chrome and Firefox can't play ALAC, and a WAV is about eight times the size. The tiny UI clicks in `public/sfx/` are the exception, since Web Audio decodes them once up front.
- **On demand.** Music and instrument audio use `preload="none"`, so nothing downloads until someone presses play.
- **Caching.** `next.config.ts` gives media a one-day browser cache plus a week of stale-while-revalidate. A visitor can keep an old copy of a replaced file for up to a week, so give a changed file a new name (`track-02.v2.m4a`) instead of overwriting it.
- **Drafts.** Never put unreleased screenshots or videos in `public/`. Anything there can be fetched by URL, even when `server-only` hides the page that links to it.
- **When to move it.** Switch to object storage (Cloudflare R2 or S3) only if `public/` passes about 50 MB, the site leaves Vercel for a single server, or some files need a login.

## Design

The site follows the **Lab Notebook** design system. Main rules:

- Inter for all text, Geist Mono for code only.
- Blue `#0066cc` is the quiet interactive color, and it is also used for any text on a colored fill.
- Fluorescent scarlet `#ff3b1f` is the loud accent. It is never a fill behind text. Use it for marks (the dot, the squiggle, panel waves, glows) and for text 24px or larger.
- Depth follows the Obsidian/Apple glass style: specular top edges, sheens and layered shadows.

Design references: [design system](https://claude.ai/artifact/CTHt2p3SY6onsctFExQ3G5) · [mockups](https://claude.ai/artifact/BbL3gvBjGmgmu5MYyZSPaY)

## Deploys

- **Pushes to `main`** deploy to production through Vercel's Git integration.
- **Other branches and pull requests** get a preview URL.
- **GitHub Actions** (`.github/workflows/ci.yml`) runs lint, typecheck and build on every push.
