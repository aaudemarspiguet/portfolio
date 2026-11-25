# Handoff: the "studio loft" portfolio homepage

This brief is self-contained. Hand it to any design or coding model or person. It describes an interactive homepage for amoghmade.dev, the portfolio of Amogh Paruvelli, a software engineer. Everything here was agreed with Amogh except the items under "Open decisions".

## 1. The idea in one paragraph

The site opens zoomed all the way into a desktop computer screen. The screen shows Amogh's name and tagline: this is the hero. When the visitor scrolls (or presses "enter the room"), the camera pulls back out of the screen and reveals the room around it, an industrial studio loft. The room is the navigation. Each object leads somewhere: project canvases on the brick wall open case studies, the desktop opens his experience, the window switches day and night. It should feel like exploring a room in a point-and-click or escape-room game, but a recruiter must still reach the work in one click.

## 2. Who it's for, and the rule that protects them

- **Readers:** recruiters and engineers skimming for evidence, plus people who arrive from Amogh's music.
- **The rule:** the room must never outrank the work. Every object shows a hover/focus label saying where it goes, the project canvases show real screenshots, and a plain list of projects and roles is always one click away ("skip the room → list") and also sits below the room for scrollers.
- **Positioning:** engineer first, product sense second. The polish should read as judgment, not decoration.

## 3. Why this must be built in real 3D (lesson from the first prototype)

A first prototype was drawn in flat 2D (SVG/CSS polygons faking one-point perspective). It failed: the desk did not sit on the floor plane, objects did not share one vanishing point, scales were inconsistent, and nothing felt solid. Faking perspective object by object does not work.

**Do this instead:** build the room as an actual 3D scene with one camera, so perspective, scale and occlusion are correct by construction. Two good routes:

| Route | What it is | Pros | Cons |
|---|---|---|---|
| **A. Pre-rendered layers (recommended for v1)** | Model and light the room in Blender (or Spline), render from one fixed camera, export each interactive object as its own transparent layer (WebP/AVIF), plus a night lighting pass of each | Fast page, perfect perspective, Gumball-style "real objects" look, easy hover highlights (swap to a lit layer) | Camera moves are limited to 2D zoom/pan of the render; re-render to change anything |
| **B. Real-time 3D** | three.js via React Three Fiber (`@react-three/fiber`, `@react-three/drei`), or a Spline scene embedded with `@splinetool/react-spline` | True camera fly-through from the screen to the room, live lighting for day/night | Heavier (bundle and GPU), needs a static fallback for low-end phones and reduced motion |

Either way: one camera, eye height about 1.6 m, roughly one-point perspective facing the brick wall, a horizon line a little above the desk. The "pull back from the screen" move is the camera dollying back from the monitor (route B) or a scale-down of the full render around the monitor's position (route A).

## 4. The room: layout

Camera faces the back wall. Coordinates: left/right as seen by the visitor.

| Zone | Object | Notes |
|---|---|---|
| Back wall | Exposed brick, painted off-white | The main surface. Baseboard along the bottom. |
| Back wall, upper left | **Neon sign** reading "amogh's space" (script neon tubing on a clear backing plate, hung on two wires) | Off and grey by day, glowing scarlet-pink at night. Keep clear space around it; nothing overlaps it. |
| Back wall, center to right | **Project canvases**, a salon-style collage: 4 framed canvases in different sizes and aspect ratios (one wide, one landscape, two portrait), each slightly tilted | Show the real project screenshots (Section 7). Frames have visible depth. |
| Back wall, left of canvases | **Poster** in a thin black frame, slightly crooked | Amogh's own print of the album *Slime Season 2* (photograph his print; don't recreate the cover art). |
| Back-left corner | **L-shaped desk** along the back wall and the left wall | White top, black steel legs, PC tower underneath with a small LED. |
| On the desk | **Desktop monitor** (the hero screen), flanked by two **studio monitors** (speakers) | The monitor is where the intro zooms out from. |
| Back-right, along the wall | **Synth rack**: a two-tier keyboard stand | Upper tier: a Minimoog Model D and a Sequential Prophet-5. Lower tier: a Roland Juno-60. |
| Back-right corner | **Floor lamp** | Warm glow at night. |
| Right wall | **Electric guitar** on a wall hook, Rickenbacker style (330/360 body shape, Fireglo red or Jetglo black) | |
| Left wall | **Industrial window**: black steel frame, 2×3 panes, sill | Daylight streams in by day (a light beam across the floor). Night sky with moon at night. |
| Floor | Concrete or wood, a **green shag rug** in the middle | Virgil Abloh × IKEA MARKERAD `"WET GRASS"` green shag rug. |

Optional later props: coat rack with headphones, a backpack.

## 5. Interactions

| Object | Hover/focus label (mono) | Click/Enter |
|---|---|---|
| Desktop monitor | `desktop · experience` | Zoom into the screen → a terminal view (`cat experience/*.txt`) listing the roles in Section 7, with an `exit` button |
| Each project canvas | `p-01 · find the outfit →` | Zoom into that canvas → its case-study page |
| Window | `window · night mode` | Toggle day/night |
| Neon sign | `neon · flick it` | Brief flicker |
| Synth rack | `synth rack · ▶ jam` | Keys light up, level meter bounces, optionally plays a short clip of Amogh's music. **Only on click, never autoplay, no UI click sounds.** |
| Guitar | `guitar · strum it` | Swings gently on its hook |
| Poster | `poster · …` | Straightens itself |

Global controls (top bar): `↺ back to the screen` (zoom back into the hero), `skip the room → list`, and a day/night toggle. Day/night is the site's light/dark theme, and it should follow the visitor's system setting by default.

Motion: camera moves about 0.7 s, eased. Under `prefers-reduced-motion: reduce`, skip all zooms and loops (clicks go straight to the destination).

## 6. Visual language

**Inner pages (case studies, list, terminal) use the "plotter notebook" style:** a clean frame with a technical, hand-made layer on top. That means printer's crop marks in the corners, a technical-drawing dimension line (for example under the name, labelled with the pronunciation "uh-MOH-g"), hand-hatched charts of real results, a waveform section divider with a scarlet playhead, monospace for data (dates, tags, metrics, meta rows), and the current git revision in the nav.

- **Type:** Inter for headings and body; Geist Mono for data only, in sentence case, never uppercase, never for sentences; a script neon face (for example Neonderthaw) only on the sign.
- **Colors:** paper `#f4f3ef`, ink `#1d1d1f`, blue `#0066cc` (links and interactive), fluorescent scarlet `#FF3B1F` (marks and signals only). A "Blueprint" palette was shortlisted as an alternative: `#eef4f8` / `#023047` / `#219ebc` / `#fb8500`.
- **Scarlet rule:** scarlet is never a fill behind text. It's for marks (dots, glows, playheads, the neon) and for text at 24px or larger.
- **No fake data visuals.** Every chart or number shown must be real.
- **Avoid:** dot-grid or hairline "editorial" backgrounds, uppercase mono labels, gradient washes, emoji.

## 7. Real content (use verbatim; never invent copy, links or numbers)

**Hero (on the monitor screen)**
- Prompt line: `amogh@loft ~ % whoami`
- Name: **Amogh Paruvelli.** (scarlet period)
- Info line: Software Engineer · Madison, WI · Graduating December 2026 · pronounced "uh-MOH-g", meaning "unerring"
- Tagline: "I build LLM apps, evals and ETL pipelines. Recent work: a RAG bot that knows when to stay quiet, and an ingest job cut from 60 minutes to 3."
- Now: "Capstone for Amazon Fashion Labs"
- Actions: Email me (amoghparuvelli@gmail.com), GitHub (https://github.com/aaudemarspiguet), LinkedIn (https://www.linkedin.com/in/amogh-paruvelli)

**Projects (the canvases)**, images in the repo under `public/projects/`:

| Code | Title | Meta | Image | One-line summary |
|---|---|---|---|---|
| p-01 | Find the Outfit | University capstone · 2026 · TypeScript, AWS Lambda, Bedrock | `find-the-outfit/06-you-found-it.jpg` | Guess a Shopbop item from a corner of its photo. An AI model scores how close your description is in meaning, and the photo widens as you go. |
| p-02 | SAW: Shared Agent Workspace | Agent tooling · 2026 · TypeScript, MCP, WebSockets | `saw/06-bob-replies-light.jpg` (+ `-dark`) | A shared thread where a whole team's coding agents trade messages and branch names but never code. Everyone can read along and steer their own agent. |
| p-03 | Safety vs. Utility in LLM Activation Spaces | AI research · 2026 · PyTorch, Transformers, NumPy | `llm-ablations/04-team-matrix-gemma.png` | Harmful prompts a small open model answered went from 1% to 84% once its safety direction was removed, with benchmark scores barely moved (N=100). |
| p-04 | QnA: a course board with a cited AI answerer | Course project · 2026 · FastAPI, RAG, React | `qna/04-student-ai-answer-with-sources.jpg` | A course bot that answers only when it finds a close enough passage in the course material, and cites it. |

Full case-study text lives in `src/content/projects.ts`.

**Experience (the terminal)**
- Data Engineer Intern @ Ebara Elliott Energy · May to Aug 2026 · Built a self-service upload app that cut data ingestion from 60 minutes to 3. Consolidated records from 15 sources.
- Software Engineer @ Handlab Poker Intelligence · Feb to Jul 2026 · Built zip uploads for a poker hand tracker with plain-English search, so a folder of 11 session files imports 505 hands at once.
- Software Engineer Intern @ Spencer's Gifts / Spirit Halloween · Jun to Sep 2025 · Wrote the Java endpoint for selected-store pickup status and Redis lookup calls ahead of Halloween.
- BS, Computer Science and Data Science @ University of Wisconsin–Madison · Graduating Dec 2026

## 8. 3D assets: sourcing (checked Nov 24, 2026)

Free, properly licensed models of these exact instruments are rare. Check every license page again before downloading or buying, and confirm it allows use on a public website. Branded models often carry "editorial" terms; hide or remove logos either way.

| Item | Option | Price | License (as shown) | Verdict |
|---|---|---|---|---|
| Prophet-5 | [Prophet 5 Synthesiser by Faheem Yusuf (Sketchfab)](https://sketchfab.com/3d-models/prophet-5-synthesiser-29e4bcab7b0d428e85473f74cda6011d) | Free | CC Attribution | **Use it.** Credit the author on the site. |
| Prophet-5 | [Sequential Prophet 5 (CGTrader)](https://www.cgtrader.com/3d-models/electronics/audio/sequential-prophet-5) | about $39 | Royalty free (no AI) | Paid backup |
| Prophet-5 | [Sequential Prophet 5 (TurboSquid 1688441)](https://www.turbosquid.com/3d-models/sequential-prophet-3d-model-1688441) | about $30 | Check page | Paid backup |
| Minimoog Model D | [Minimoog Model D (CGTrader)](https://cgtrader.com/3d-models/electronics/audio/minimoog-model-d) and [Minimoog Model D 1970 (CGTrader)](https://www.cgtrader.com/3d-models/electronics/audio/minimoog-model-d-1970) | about $15–20 | Check page | **Buy one.** The Minimoogs on Sketchfab ([asorgejr](https://sketchfab.com/3d-models/minimoog-model-d-7a40d8ea7fc149088d0d7e0017766769), [Sweboz](https://sketchfab.com/3d-models/minimoog-model-d-1970-8e41ced6598448c38948a9d947a0233a), [TimBuhrs](https://sketchfab.com/3d-models/minimoog-model-d-synthesizer-6d1aa9e5026d4fa68938254d082c8693)) show no download license, so they are view-only. |
| Juno-60 | [Roland Juno-6 (TurboSquid 1536225)](https://www.turbosquid.com/3d-models/3d-roland-juno-6-model-1536225) | $19.99 | Check page | **Buy it.** The Juno-6 shares the Juno-60's case and layout; recolor the panel buttons if needed. |
| Juno-60 | [Roland Juno-60 (MakerWorld)](https://makerworld.com/en/models/1238798-roland-juno-60) | Free | Not stated | A 3D-print fridge-magnet replica; low detail, license unclear. Last resort. |
| Rickenbacker guitar | [Rickenbacker 12-string, Tobacco Sunburst (RenderHub)](https://www.renderhub.com/spiritswitchboard/rickenbacker-12-string-guitar-tobacco-sunburst-finish) | Paid | Extended use, IP restricted | **Best fit to buy** (360-style body, glTF included). Check the IP terms. |
| Rickenbacker guitar | [Rickenbacker 4001 bass (Sketchfab)](https://sketchfab.com/3d-models/rickenbacker-4001-bass-guitar-3afb4f90b86b4635bf9adc095e6b48dd) | $14.99 | Editorial | A bass, not a guitar; editorial terms. |
| Rickenbacker guitar | [1965 Rickenbacker 360-12 Fireglo (Sketchfab)](https://sketchfab.com/3d-models/1965-rickenbacker-360-12-fireglo-0a00e0a313904ad39f331e31afe9543e) | Free | Marked CC Attribution | **Avoid.** Its own description says it is the guitar from the *Beatles Rock Band* video game, so it is likely a ripped game asset the uploader can't license. |
| Studio monitors, desk, lamp, monitor, PC | Generic models | Free–cheap | Prefer CC0 | See the low-poly table below. |

Alternative to buying: photograph Amogh's own gear and cut it out. That's free and the most personal.

### Low-poly furniture and gear (decided 2026-11-24)

Amogh wants the studio monitors and the desk to be **low-poly 3D models**, not drawn shapes. The desktop is an **iMac-style all-in-one, larger than a normal monitor** (thin screen, chin, angled stand, no Apple logo).

| Item | Option | License (as shown) | Notes |
|---|---|---|---|
| L-shaped desk | Kenney [Desk](https://poly.pizza/search/desk) + [Desk Corner](https://poly.pizza/m/LCfBX1FVJr) | Public domain (CC0) | Combine a desk run and the corner piece into the L; recolor to a white top with black legs |
| Studio monitors | Kenney [Speaker Small](https://poly.pizza/m/YaVrUj51TV) | Public domain (CC0) | Scale to nearfield size and angle toward the chair |
| Studio monitors (alt) | [Desk speakers by jeremy](https://poly.pizza/m/eKyOw4k5_dW) | CC Attribution | Credit the author if used |
| Studio monitors (look to aim for) | [Yamaha studio monitor by Emcee Em (Sketchfab)](https://sketchfab.com/3d-models/yamaha-studio-monitor-photorealistic-3d-model-66fa5d05a33947ed966111b051c7b62f) | View only: no download, no license, not for sale | **Reference only.** Model a low-poly version from primitives instead: black box cabinet, white woofer cone (the HS-series signature), small tweeter dome above, a rear port slot, no logo. About 200–500 triangles. |
| iMac-style desktop | Model it from primitives (a thin box, a chin, an angled stand) | Yours | No free iMac-shaped model turned up; a [low-poly iMac on CGTrader](https://www.cgtrader.com/3d-models/electronics/computer/apple-imac-low-poly) is editorial-only. A few boxes are enough at low poly, and the screen face doubles as the hero surface. |
| Lamp, rug, other props | The rest of [Kenney's Furniture Kit](https://kenney.nl/assets/furniture-kit) (140 files) | CC0 | One consistent low-poly style for the whole room |

**Keep one style across the room.** If the furniture is low-poly (Kenney style), realistic purchased instrument models will clash with it. Either bring the instruments down to the same look (decimate them and use flat shading and simple materials; the free Prophet-5 at about 50k triangles can be reduced), or commission or model simple low-poly versions of the Minimoog, Juno and guitar. Decide this before buying anything.

## 9. Requirements

- **Stack:** the existing repo is Next.js 16 (App Router, Cache Components on) with plain CSS (tokens in `src/styles/tokens.css`, `.ln-*` classes in `src/styles/components.css`), no Tailwind. Next 16 has breaking changes: read the guides in `node_modules/next/dist/docs/` before using any Next API.
- **Accessibility:** every object is a real `<button>` or `<a>` with an accessible name, in a sensible tab order, with a visible focus ring. The scene image is decorative; the buttons carry the meaning. Text contrast at least 4.5:1.
- **Reduced motion:** no camera moves, spins, flickers or loops.
- **Phones:** design this up front. Options: pan the wall sideways, or collapse to the canvas wall plus a list. The plain list must work perfectly on a phone.
- **Performance:** the hero (the monitor screen) is real HTML text, painted first. Load the room behind it lazily. Route A: responsive WebP/AVIF layers. Route B: compressed glTF (Draco/Meshopt), a static poster image while loading, and a fallback when WebGL is unavailable.
- **SEO and sharing:** all text content exists in the HTML, not only inside a canvas.

## 10. Acceptance checklist

- [ ] First paint shows the name and tagline on the monitor screen as readable HTML.
- [ ] Scrolling or "enter the room" pulls back to reveal the full room, with perspective that is correct and consistent (one camera).
- [ ] Every object has a hover/focus label and a working click/keyboard action.
- [ ] Day/night changes the window, the neon, the lamp and the overall lighting, and follows the system theme by default.
- [ ] "skip the room → list" works from anywhere, and the list holds every project and role.
- [ ] Reduced motion and phone layouts work.
- [ ] No invented copy or numbers. No unlicensed assets. Credits are shown for CC-BY models.

## 11. Open decisions (ask Amogh)

1. Route A (pre-rendered layers) or route B (real-time 3D)?
2. Buy models, photograph his own gear, or mix the two?
3. Which palette: the current blue and scarlet, or Blueprint?
4. Should the synth play a clip of his music on click? Which track?
5. Phone layout: a horizontally panning wall, or a collapsed list?
