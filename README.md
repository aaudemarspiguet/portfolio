# Portfolio

Personal site for a software engineer working on applied AI and data. Built with Next.js and deployed on Vercel.

Live at https://amoghmade.dev.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Generate route types, then run `tsc` |
| `npm run build` | Build for production |

## Where things live

- `src/content/site.ts`: home page copy (name, links, experience roles, education, about, stack, contact).
- `src/content/projects.ts`: case studies. `kind: "project"` entries are the home page cards; `kind: "work"` entries are linked from their experience row.
- `src/content/placeholder.ts`: the template-mode marker. `grep -rn "placeholder(" src/content` lists copy still to be written. The pre-template copy is at git tag `copy-v1`.
- `src/styles/tokens.css`: design tokens (color, shadow, type, spacing, radius) for light and dark.
- `src/styles/components.css`: the `.ln-*` component styles.
- `src/components/`: React components. Only the nav, theme toggle, copy-email button and clock run on the client.

To change copy, edit the two files in `src/content/`. Each case study has a cover and can have an optional diagram and optional live or repo links. The résumé download lives in `public/Amogh_Paruvelli_Resume.pdf`.

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
