# Design review changelist (Nov 2026)

Branch: `design/review-evidence`. Nothing is implemented yet. This file is the handoff: each task is self-contained, with files, notes from reading the code, and what done looks like.

## Why

A design review (Nov 22, 2026; private doc) compared this site with two developer portfolios. Its finding: the site has strong engineering content, but that content sits one click deep, behind a surface that reads like a polished consumer app. The goal is that a stranger's first screen and first scroll say "strong engineer" first and "well made" second. The fix is to bring the evidence to the surface and add a thin monospace layer, not to re-skin the site.

### First-screen test (acceptance for the whole branch)

In the first screen plus one scroll, at least three of these are visible:

- A hero line that leads with what you build (kept as is: "I build LLM apps, evals and ETL pipelines.")
- Stack and metrics in mono, so they read as data
- A pipeline diagram as a project image
- Repo links (and a résumé link, if T14 says yes)
- A "Decision: X over Y, because Z" line on a card

## Decisions (Amogh, 2026-11-22)

| Topic | Decision |
| --- | --- |
| Mono | Sentence-case Geist Mono for **data only**: dates, tags, metrics, meta rows, the Now chip. Never sentences, never uppercase. Headings and body stay Inter. Replaces the Nov 3 "mono for code only" rule. |
| Projects | Replace the parallax carousel with a static grid: 2×2 on desktop, one column on phones. |
| Music | Shown without words only: a waveform replaces the hero squiggle, plus a Spotify icon. No copy about music. |
| Hero | Keep the current line. Product sense comes through decision lines, not a label. If one is ever needed, it's "product engineer", never "PM/SWE hybrid". |
| Positioning | A portfolio now, built so it can grow into a personal site (see T15). |
| Allo font | Deferred. If tried, after the evidence tasks land: headings only, roundness 0, Inter body, Geist Mono data. |

Skip: a dot or grid background (rejected earlier as a "Claude design tell"), autoplay or click sounds, and any heavy terminal costume (at most two terminal motifs, if any).

## Ground rules

- Read the relevant guide in `node_modules/next/dist/docs/` before touching Next APIs (Next 16, Cache Components on; see AGENTS.md).
- Plain CSS: tokens in `src/styles/tokens.css`, `.ln-*` classes in `src/styles/components.css`. No Tailwind.
- Scarlet `--accent` marks things (dots, waves, ≥24px text). It is never a fill behind text.
- Content is Amogh's. Tasks marked **needs content** get a code slot plus a proposed draft; don't ship invented copy, links or numbers.
- Verify with the `portfolio-build` launch config (port 3005). CI runs lint, typecheck and build.

## Tasks

Ordered by signal per hour of work. Tasks in the same group touch different files and can run in parallel.

### Group A: small fixes (independent)

**T1. Handlab "Next role →" links to itself.**
`nextProject()` (`src/content/projects.ts:705`) cycles through non-draft projects of the same kind. Ebara is a draft, so Handlab is the only `kind: "work"` entry and wraps around to itself.
Done: `nextProject` returns `undefined` when there's no other entry, and `src/app/work/[slug]/page.tsx` skips the `.ln-next` card in that case.

**T2. Anchor jumps land with a large gap.**
`.ln-section` has `padding-top: var(--sec)` (space-30 on desktop, 72px on phones) and `scroll-margin-top: 80px`, so a jump lands with the whole section padding above the heading.
Done: `/#projects`, `/#experience` and `/#about` put the section heading just under the nav pill at desktop and 375px widths. Options: a negative `scroll-margin-top: calc(<nav clearance> - var(--sec))`, or move the ids onto the section headers.

**T3. Content shows above the floating nav while scrolling.**
`.ln-header` is sticky at `top: var(--space-3)`, and text scrolls through the gap above the pill.
Done: a `--paper` fade band (`.ln-header::before`, `pointer-events: none`) hides the gap in both themes. Keep the glass pill as it is.

**T4. "Current" badge covers SAW's screenshot header.**
`.ln-card__badge` sits top-left, and SAW's cover uses `focus: "center top"`, so the app header is right under the badge.
Done: move the badge to the bottom-left (or top-right) and check it on all four cards in both themes.

**T5. SAW's Fig. 1 is a sparse row of pills.**
`.ln-diagram` forces `aspect-ratio: 16 / 7` whatever the node count.
Done: drop the fixed ratio so the strip hugs its content, or give SAW a real `architecture` diagram (preferred; it would also feed T7). **Needs content** for the diagram.

### Group B: project cards (one session; T6 and T7 share files)

**T6. Replace the carousel with a static grid.**
- `src/app/page.tsx`: render `highlightedProjects` (4 today: find-the-outfit, saw, llm-ablations, qna) in a grid with the `SectionHeader`. Use 2 columns from about 900px, 1 below.
- Delete `src/components/ProjectCarousel.tsx` and the `.ln-carousel*` CSS (its MIT notice goes with it).
- Remove the `parallax`/`decorative` props from `ProjectCover`, `CoverMedia` and `CoverVideo` once nothing uses them.
- Update the comments that mention the carousel: `ProjectFlag` in `projects.ts`, `.ln-more` in the CSS, `src/app/projects/page.tsx`.
- `/projects` currently shows the same four. Later it holds the extras: smaller experiments, the WPO replication, claude-devkit (**needs content**).
Done: all four cards visible at once, no dimmed cards, keyboard and screen reader read four links, no layout shift.

**T7. Pipeline diagrams as card covers. Dropped (2026-11-24).** At card size the labels shrink to about 8px, so a diagram cover is decoration, and the screenshots carry the product signal. Decision lines (T12) carry the engineering signal on cards instead. The notes below are kept for reference.
`Architecture` (`src/components/Architecture.tsx`) renders `<svg class="ln-arch" role="img" aria-labelledby>` with `min-width: 720px` (for the scrollable case-study figure). find-the-outfit, llm-ablations and qna have `caseStudy.architecture`; SAW doesn't (keeps its screenshot until T5).
- Add a `decorative` mode: `aria-hidden`, no `labelId`. Inside `.ln-card__cover`, drop the min-width and fit the SVG (default `preserveAspectRatio` meet) on `--paper-raised`.
- Labels shrink to about 8px at card size. Judge it in the browser. If it's too small, fall back to a hover/focus swap (screenshot by default, diagram on hover) or a "How it works" peek.
Done: the first project image a visitor sees is a real system diagram, readable as one at a glance, in both themes.

### Group C: type and marks (independent of B)

**T8. Mono layer for data.**
`--font-mono` (Geist Mono) is already loaded. Apply it to:
- `.ln-tag`
- `.ln-card__area` (area · year)
- `.ln-metric__value`
- `.ln-list__when` (dates)
- `.ln-meta dt`, plus the Timeline and Stack `dd` (add a data attribute in `work/[slug]/page.tsx`)
- `.ln-now`
- `.ln-stack .ln-chip`
- the `.ln-label` eyebrows under section and case-study headers

Sizes may need −1px and `letter-spacing: 0`. Never on `.ln-metric__base`, summaries or body text.
Done: data reads as data, nothing is uppercase, and the Now chip still fits one line at 375px.

**T9. Waveform replaces the squiggle.**
`Squiggle` in `src/components/marks.tsx` and `.ln-squiggle` CSS. Draw evenly spaced vertical bars with varying, deterministic heights in `--accent`. Use `vector-effect: non-scaling-stroke` so bar width stays fixed as the phrase width changes. Animate it in like a playhead (a `clip-path: inset()` reveal left to right, about 0.9s) only under `prefers-reduced-motion: no-preference`. Rename the component and class to `Waveform` / `.ln-wave`.
Done: it reads as audio, not as an IDE error, in both themes and at 375px. The `white-space: nowrap` phrase must still not overflow.

### Group D: evidence links and copy (each **needs content**)

**T10. Spotify icon.** Add `site.links.spotify?` in `src/content/site.ts` and render an icon link next to GitHub/LinkedIn in the hero actions and `ContactPanel` when it's set. Needs the URL.

**T11. Repo and demo links on every project.**
`Project.links { live?, repo? }` is already typed, and the case-study meta renders a Links row (`work/[slug]/page.tsx`), but no project sets it.
- Fill in the URLs (SAW is public; start there).
- Show small mono links on cards too: `repo ↗`, `demo ↗`. The card is one `<Link>`, so restructure it first (a stretched-link pattern or links outside the anchor), since nested `<a>` is invalid.
- Consider `repo: "private"` rendering as "Repo: private, ask me", only for repos Amogh confirms are private.

**T12. Decision lines.** Add an optional `decision` field to `Project` and render it on the card as "Decision: X over Y, because Z". This makes the defensible product choices visible. Draft one per highlighted project from the trade-offs each case study already argues; Amogh approves the wording.

**T13. Real artifacts inside case studies.** A 10–20 line code excerpt per study (the eval scorer, a SAW hook, an MCP tool definition), a terminal or agent-session capture, and any formula written as prose turned into a code block. `.ln-code` styling exists, but `Body` is strings only, so add a code section type. Source the excerpts from the repos or evidence kits.

### Open questions (ask Amogh before building)

**T14. Résumé link: on or off?** The review recommends one in the nav and hero. But commit `26b20f1` ("remove hosted resume") took the PDF down on purpose, and `base.tex` is the only source. Ask whether to bring it back as a hosted PDF built from `base.tex` (phone number removed), a "Résumé on request" mailto, or nothing.

**T15. `/notes` dated log plus RSS (later).** One line per entry: a mono date, a sentence and a link. It gives agent-tooling work a home that isn't a polished case study. An RSS route handler needs a read of the Next 16 docs first. Not part of this branch unless asked.

### Optional, later

- At most two terminal motifs: the Now chip as a status line, or a footer stamp of the last deploy's commit taken at build time.
- Allo heading trial (see Decisions).
