# Handoff for Neon: build the Studio Loft homepage

This brief tells you how to rebuild the Studio Loft prototype as the real homepage of amoghmade.dev. The goal is to match the prototype exactly: the same look, the same camera moves and the same behavior. Where this document and the prototype disagree, the prototype wins. Where the prototype and the repo's content files disagree on copy, the content files win (see section 2).

The prototype was reviewed and approved by Amogh on 2026-11-24, after several rounds of fixes. The decisions in it are settled. Don't redesign, "improve" or simplify any of it without asking him first.

## 1. Files

| File | What it is |
|---|---|
| [plans/studio-loft/index.html](studio-loft/index.html) | **The reference.** A single-file prototype (three.js r128 from cdnjs, about 1,150 lines). Every number in this brief comes from it. |
| [plans/studio-loft/img/](studio-loft/img/) | The images the prototype loads. All of them except `jeffery.jpg` are copies of files already in `public/` (table in section 9). |
| [plans/room-concept-handoff.md](room-concept-handoff.md) | The original concept brief. Its content and accessibility rules still apply. Its object list and the hover labels in its section 5 are **out of date**. Use this document for those. |
| [plans/room-concept-v2.md](room-concept-v2.md) and [plans/studio-loft-prototype.html](studio-loft-prototype.html) | An older review and prototype. **Superseded.** Don't copy from them. |

**Run the reference.** It loads textures over HTTP, so opening it with `file://` won't work. From the repo root:

```powershell
python -m http.server 4173 -d plans/studio-loft
```

Then open http://localhost:4173. Keep it open next to your build and compare the two at 1440×900, 1280×720, 1024×768 and 375×812, in light and in dark mode.

## 2. Ground rules

1. **Stack.** Next.js 16 (App Router, Cache Components on) with plain CSS: tokens in `src/styles/tokens.css` and `.ln-*` classes in `src/styles/components.css`. No Tailwind. Next 16 has breaking changes, so read the guides in `node_modules/next/dist/docs/` before you use any Next API (see `AGENTS.md`).
2. **Copy comes from the content files**, never from the prototype's inline arrays: `src/content/site.ts` (hero, roles, about, stack) and `src/content/projects.ts` (projects, ledes, images). The prototype's `PROJECTS`, `ROLES` and `STACK` arrays are stand-ins. Never invent copy, links or numbers.
3. **three.js.** Add `three` as a pinned dependency and load the room in a client component, lazily, behind the HTML hero. The prototype uses r128. On a current release, change `renderer.outputEncoding = THREE.sRGBEncoding` to `renderer.outputColorSpace = THREE.SRGBColorSpace`, and change `texture.encoding = THREE.sRGBEncoding` to `texture.colorSpace = THREE.SRGBColorSpace`. Then check that the colors still match the reference, because newer releases also changed lighting units. Adjust the light intensities until the room looks the same as the reference in both themes.
4. **No new text in the room.** Don't add project codes ("p-01 ·", "p-02" and so on) anywhere a visitor can see them. They were removed on purpose. The keys can stay in code as internal ids.

## 3. Page structure

The page has three views. Only one shows at a time.

| View | What shows | When |
|---|---|---|
| `room` (default on desktop) | The top bar plus the stage: a 3D room with the HTML hero sitting on the iMac screen | First visit on a screen wider than 640px |
| `plain` | The top bar plus the normal homepage sections: hero, Projects collage, Experience list, Background (school and stack), contact panel | The "plain view" button; always on phones; when WebGL fails |
| `about` | The top bar plus the "A little about me" page | The About nav link while in plain view |

- Save the chosen room or plain view in `localStorage` under `view`, and the theme under `theme`. Wrap every storage read and write in try/catch.
- At 640px wide or less, force `plain` and hide the view toggle.
- If WebGL can't start, show `plain` and hide the view toggle.

## 4. Design tokens (exact)

```css
:root {
  --paper: #f5f5f7; --paper-sunk: #ebebef; --card: #ffffff; --ink: #1d1d1f; --ink-muted: #5f5f66;
  --glass: rgba(255,255,255,.52); --glass-edge: rgba(255,255,255,.7); --glass-ring: rgba(0,0,0,.08);
  --rule: rgba(29,29,31,.12); --link: #0066cc; --link-hover: #004f9e; --scarlet: #ff3b1f;
  --panel: #141416; --on-panel: #f4f3ef; --on-panel-muted: #a6a6ad;
}
/* dark: under prefers-color-scheme (guarded by :root:not([data-theme="light"])) and under :root[data-theme="dark"] */
--paper: #121214; --paper-sunk: #1d1d21; --card: #1a1a1e; --ink: #ececef; --ink-muted: #a3a3ab;
--rule: rgba(236,236,239,.14); --link: #4da3ff; --link-hover: #7dbbff; --panel: #0b0b0d;
--glass: rgba(30,30,34,.5); --glass-edge: rgba(255,255,255,.14); --glass-ring: rgba(255,255,255,.08);
```

- **Fonts:** Inter for headings and body, Geist Mono for data only (in sentence case, never uppercase), Neonderthaw only on the neon sign.
- **Body:** 17px, line-height 1.55, letter-spacing -0.01em.
- **Scarlet:** for marks only (the name's period, the "now" dot, the cursor dot, the neon and the synth keys), never as a fill behind text.
- **Theme:** follows the system by default. The moon button toggles it, and so does clicking the window in the room. Both do the same thing.

## 5. Top bar

- It is fixed and centered, `width: min(1120px, 100%)`, with a 48px-tall glass pill (`backdrop-filter: saturate(190%) blur(26px)`, radius 999px).
- **Layout is a three-column grid:** `grid-template-columns: minmax(0,1fr) auto minmax(0,1fr)`. The brand sits on the left (`justify-self: start`), the nav in the middle, and the end group on the right (`justify-content: flex-end`). **The nav links must not move** when the view button's label changes between "plain view" and "room view". The grid guarantees that. Don't switch it to `space-between`.
- **End group, in order:** GitHub icon, LinkedIn icon, view toggle, menu button (phones only), theme toggle. The view toggle is a mono 12px pill with `min-width: 11ch`. It reads "plain view" in room view and "room view" otherwise, and sets `aria-pressed`.
- **Nav:** Projects, Experience, About. At 640px or less the nav hides, and a full-screen menu sheet takes its place (Projects, Experience, About, Background, in 40px type).
- **Exactly one nav link is highlighted at a time, in every view.** Use a single `setCurrent(key)` function that clears every other link. The highlighted link gets `color: var(--link)` on a 12% link-tinted background.
  - In plain view, the scroll position sets the highlight (IntersectionObserver with rootMargin `-40% 0px -55% 0px` on `#work`, `#experience` and `#background`). The observer does nothing outside plain view.
  - In room view, the open card sets the highlight: a project card highlights Projects, the terminal highlights Experience, and the about card highlights About. With no card open, nothing is highlighted.
  - In about view, About is highlighted.

## 6. The stage and the hero screen

- **Stage:** `height: max(480px, calc(100svh - 88px - env(safe-area-inset-top)))`, `margin-top: 72px`, radius 20px, background `#0d0d10`, a 1px `--rule` ring.
- **Hero:** real HTML on top of the canvas, sized to the iMac screen's exact aspect ratio (1.12 : 0.63) and centered in the stage with 14px padding. Below an aspect ratio of 1 it fills the stage instead. Blue crop marks (18px, 70% opacity) sit in its four corners.
- **Hero content, in order:** the name with a scarlet period and the pronunciation tooltip ("uh-MOH-g · unerring"); the mono meta line; the lede with its bold first sentence; the dark "now" chip with a glowing scarlet dot; the actions (Email me, **Enter the room ↓**, Experience, GitHub ↗, LinkedIn ↗); the copy-email row.
- **The 3D screen shows the same hero.** Draw the live HTML hero into a canvas texture (each element's background, borders and every word, at its real position, font and color) and use that texture as the iMac screen's material. Redraw it on theme change, on resize and once the fonts load. During camera moves, the HTML hero rides on the 3D screen (section 8), so the visitor never sees a swap.
- **Entering the room:** the "Enter the room ↓" button, a downward wheel scroll on the hero (when the hero isn't scrolled), or a 40px upward swipe on touch.

## 7. The room (scene spec)

Units are meters. The camera faces the back wall (−z). x runs left to right as the visitor sees it.

**Renderer:** antialias on, pixel ratio `min(devicePixelRatio, 2)`, sRGB output, PCF soft shadows. `MeshStandardMaterial` with `flatShading: true` by default (low-poly look), roughness 0.8, metalness 0.05.

**Camera:** `PerspectiveCamera`, near 0.05, far 60. FOV is 50, or 54 when aspect < 1.4, or 62 when aspect < 1. The wide shot `WIDE` sits at pos (0.1, 1.6, z) and looks at (0, 1.52, −2), where z is 4.1, or 4.9 when aspect < 1.4, or 5.6 when aspect < 1.

| Object | Placement and build |
|---|---|
| Shell | Floor plane 8×6 at y 0 (procedural wood planks, repeat 3×3). Ceiling at y 3.3. Back wall at z −3 (procedural off-white brick, repeat 5×4). Plaster right wall at x 4. White baseboard 0.12 tall. |
| Window | Left wall, x −4. The opening runs z −2.45 to −0.75 and y 0.95 to 2.45. Build the wall from four panels around the opening, so sunlight really comes through. Steel frame, 2×3 panes (one vertical and two horizontal mullions), a sill. Sky plane behind it: `#9fd0ff` by day, `#0d1733` at night, with a moon (radius 0.07) at night only. |
| L-desk | Back-left corner. White top at y 0.74: one run 2.75 × 0.72 along the back wall, one run 0.72 × 1.5 along the left wall. Thin black legs, a back stretcher. |
| iMac | Group at (−2.5, 0.76, −2.7), rotated y 0.1. Screen 1.12 × 0.63, with a black bezel, a silver chin 0.11 tall, an angled silver stand and a white keyboard. No logo. |
| Nearfield monitors | At (−3.5, z −2.66, rot y 0.28) and (−1.5, z −2.66, rot y −0.18), scale 1.5. Black cabinet 0.19 × 0.29 × 0.23, white woofer cone, black dust cap, steel tweeter. |
| Neon sign | Group at (−2.45, 2.5, −2.96), scale 1.25. Clear backing plate 1.95 × 0.6 at 18% opacity, the text plane 1.9 × 0.58 reading "amogh's space" in Neonderthaw 170px, two hanging wires. Grey `#8f8a83` by day. At night: emissive `#ff5a3c` at intensity 3, color `#ffd6cc`, plus a scarlet point light (intensity 1.1, distance 4.5). |
| Poster | Group at (−0.78, 1.72, −2.975), tilted z 0.06. Black frame 0.78 square, art 0.7 square, using **`jeffery.jpg`** (Young Thug, *Jeffery*). This replaced the *Slime Season 2* poster named in the older docs. |
| Project canvases | At z −2.95, no tilt. Centers and size (the longest side): Find the Outfit (0.12, 1.66, 1.2); Safety vs. Utility (1.1, 2.3, 1.2); SAW (1.1, 1.42, 0.84); QnA (2.26, 1.72, 0.96). Each canvas takes its screenshot's aspect ratio. QnA is cropped to aspect 0.86, showing the middle slice of the screenshot, top-aligned. The frame edge is `#fbfbf9`, 0.045 deep. SAW swaps to its `-dark` screenshot in dark mode. |
| Canvas LEDs | Each canvas has a halo plane on the brick behind it (additive blending, color `#ffd9b0`) and a thin LED strip under it. Halo opacity: 0 by day, 0.85 at night. On hover, add 0.55 by day or 0.35 at night. Ease toward the target at 0.15 per frame. Strip color: `#55555a` by day, `#fff1dc` at night. |
| Synth rack | Group at (2.7, 0, −2.42), rotated y −0.32. A two-tier steel stand: the lower tier leans 0.2 rad and holds a long dark poly synth (with a colored button band); the upper tier leans 0.38 rad and holds two short synths with wood cheeks. |
| Floor lamp | At (3.78, 0, −2.78). A pole 1.62 tall, then a gooseneck arc (a Catmull-Rom tube with 15 ribs) reaching toward the room. The shade is aimed at (1.3, 1.85, −2.95), so it lights the canvases at night. A point light (intensity 1.25) and a spot light (intensity 2.6, angle 0.62, penumbra 0.7) at night only, both `#ffb35c`. |
| Guitar | Hangs from a pivot at (3.2, 2.55, −2.97). Rickenbacker-style body (an extruded bezier shape), black with an orange-to-amber burst face, white binding and pickguard, a wood neck. |
| Rug | 2.9 × 1.9 × 0.025 at (0.1, y, −0.55). Deep green `#1f6b34` shag (procedural speckle) with “WET GRASS” in off-white. |

**Lights**

| Light | Day | Night |
|---|---|---|
| Clear color | `#bfd8ef` | `#07080c` |
| Hemisphere (sky `e8eef6`, ground `b7ab98`) | 0.75 | 0.1, sky `#4b5a86` |
| Ambient | 0.15 | 0.03 |
| Sun (directional from (−8.5, 4.2, −1.3) through the window, shadow map 1536) | 1.5, `#fff1d6` | 0.12, `#7d93c9` |
| Lamp point / spot | 0 | 1.25 / 2.6 |
| Neon point | 0 | 1.1 |
| Screen glow (`#9fc7ff`, near the iMac) | 0 | 0.6 |

## 8. Camera moves (the core of the experience)

Every move uses one tween: lerp the position and the look-at point together with ease-in-out cubic (`x < .5 ? 4x³ : 1 − (−2x + 2)³ / 2`). While a tween runs, ignore hover and look-around input.

| Move | Duration | Notes |
|---|---|---|
| Screen → wide room ("Enter the room") | 1600 ms | The hero rides the screen (below), then fades |
| Screen → a spot in the room (direct flight) | 1300 ms | Used by nav links and canvas keys while on the hero screen. **No stop at the wide shot.** |
| Spot → spot, or wide → spot | 750 ms | `zoomTo`: distance from the object along its facing direction |
| Anywhere → screen ("↺ back to the screen", clicking the desktop, the brand link) | 1400 ms | |
| Closing a card | 750 ms back to wide | This is intentional: "back to the room" means the full room |

**The hero rides the screen.** The close-up camera distance is computed so that the 3D screen exactly covers the HTML hero box. During a move out of the screen, map the HTML hero onto the projected 3D screen rectangle each frame (translate and scale from origin 0 0). On the way out, the transform amount is `smooth(0, .35, k)` and the opacity is `1 − smooth(.35, .8, k)`. On the way back in, the amount is `1 − smooth(.65, 1, k)` and the opacity is `smooth(.2, .6, k)`. Here `smooth` is smoothstep and `k` is linear progress. When the move ends, the hero gets `data-gone` (opacity 0, no pointer events) and its inline styles are cleared.

**Direct flights, no zoom-out first.** This was the last thing Amogh asked for, and it must hold everywhere:

- Experience → About flies from the screen straight to the neon sign.
- About → Experience flies from the sign straight back to the screen.
- Projects ↔ About flies spot to spot.
- From the hero screen, Projects or a canvas key flies straight to that canvas.
- prev / next glides the camera canvas to canvas behind the open card.

For reference, the timings measured in the prototype were: screen → About 1.35 s, About → Experience 1.46 s, Experience → Projects 1.31 s, Projects ↔ About about 0.8 s. A detour through the wide shot would take 2.3 s or more.

**Look around (wide shot only).** A two-finger trackpad swipe (wheel events; ignore ctrl+wheel pinch) or a two-finger touch drag nudges the yaw and pitch around `WIDE.look`. Yaw is clamped to ±0.4 and pitch to −0.12…0.14. Ease toward the target at 0.08 per frame. A one-finger drag or a mouse move only points.

**Render on demand.** Run the rAF loop always, but render only when something animates or `renderOnce()` was called.

## 9. Interactions

**Hover and focus labels.** A dark mono tag (`#1d1d1f` on `#f4f3ef`, 12px) sits above the pointer. Labels, verbatim:

| Object | Label | Action |
|---|---|---|
| iMac screen | `desktop · back to the screen` | Fly back to the hero screen |
| Window | `window · night mode` | Toggle the theme |
| Neon | `neon · flick it` | Flicker for 950 ms (a `sin(now/23)` square wave), then restore |
| Synth rack | `synth rack · ▶ jam` | Toggle: keys pulse scarlet emissive. This version plays no audio at all |
| Guitar | `guitar · strum it` | Damped swing on the hook: `0.09·e^(−2.2t)·sin(9t)` for 2.4 s |
| Poster | `favorite album · young thug – jeffery · straighten it` | Toggle between a 0.06 rad tilt and straight, easing at 0.12 per frame |
| Each canvas | the project title before any colon, lowercased, plus ` →` (for example `find the outfit →`, `saw →`) | Fly to the canvas and open its card |

**Cursor.** On fine pointers only, over the canvas, hide the system cursor and show a 10px scarlet dot with a soft glow. It grows to 16px over anything clickable. Everywhere else, the normal cursor shows.

**Keyboard.** Each object also gets a real `<button>` in a `.keys` group labelled "Things in the room". The buttons are visually hidden until focused, then appear as white pills bottom-left. On focus, the object's tag shows at its projected position. Canvas buttons fly straight there even from the hero screen. The others first enter the wide room and then act, because their effect is in the room itself.

**Image map, prototype → repo:**

| Prototype | Repo |
|---|---|
| `img/fto.jpg` | `public/projects/find-the-outfit/06-you-found-it.jpg` |
| `img/saw-light.jpg` / `saw-dark.jpg` | `public/projects/saw/06-bob-replies-light.jpg` / `-dark.jpg` |
| `img/llm.png` | `public/projects/llm-ablations/04-team-matrix-gemma.png` |
| `img/qna.jpg` | `public/projects/qna/04-student-ai-answer-with-sources.jpg` |
| `img/ebara-elliott.jpg`, `handlab.svg`, `spencers.jpg`, `uw-madison.jpg`, `amazon.jpg` | `public/logos/` (same names) |
| `img/jeffery.jpg` | **Not in the repo yet.** Add it as `public/room/jeffery.jpg` |

## 10. Nav inside the room

In room view on desktop, the nav links stay in the room. They never switch to plain view.

| Link | What happens |
|---|---|
| Projects | Close any card, fly to the **first** project canvas (Find the Outfit) and open its card |
| Experience | Run the same flow as clicking the desktop and then Experience: fly back to the hero screen, then open the terminal over it |
| About | Fly to the neon sign (distance 1.9) and open the about card |

All three fly directly from wherever the camera is: the hero screen, the wide shot, or another spot.

In plain view, Projects, Experience and Background scroll to their sections, and About switches to the about view. On desktop, the brand link always returns to room view and flies back to the hero screen. On phones it scrolls to the top.

## 11. Cards ("peeks")

A card opens over the stage on a `rgba(13,13,16,.55)` scrim. It is a `role="dialog"` with `aria-modal`. Opening it moves focus to its close button, and closing it returns focus to whatever had it before. Esc, or a click on the scrim, closes it (back to the wide shot, 750 ms). With motion allowed, the scrim fades in over .32 s and the card scales from .94 with an 8px rise over .38 s.

**Project card** (`width: min(980px, 100%)`, two columns, 36px padding, radius 16, `--paper` background):

- Top row, full width, `space-between`: on the left the `← back to the room` pill; on the right `‹ prev`, a mono count `1 / 4`, and `next ›`. The prev and next buttons carry aria-labels naming the target project ("Previous project: SAW: Shared Agent Workspace").
- Left column: a mono blue eyebrow with the meta only (`university capstone · 2026`, **no project code**); the title (26–40px, weight 500); the lede; the mono tags above a dashed rule; a primary button `Read the case study ↗` linking to `/work/[slug]`.
- Right column: the screenshot (SAW uses its dark image in dark mode), contained, max-height 420px.
- **prev / next:** wraps around (4 → 1, 1 → 4). It swaps the card contents in place without closing it, glides the camera to the new canvas behind the card (750 ms), and keeps focus on the same step button. The ← and → arrow keys do the same while a card is open.
- At 720px or less: one column, 24px padding.

**About card:** a one-column `peek__card--one`, `width: min(760px, 100%)`. It has only the back pill in the top row, the heading "A little about me" with no eyebrow, and the about paragraphs (the first at 19px).

**Terminal (Experience):** dark in both themes. Outer case `#2a2a2d`, screen `#0d1117`, text `#e6edf3`, mono 14px/1.7. It shows a prompt line `amogh@loft ~ % cat experience/*.txt` in green `#7ee787`, then each role as a blue `#79c0ff` title, a grey `@` and org, a grey date and an indented line. It ends with the prompt and a blinking caret (no blink under reduced motion). The close button reads `exit`.

**Pills must follow the theme.** `.pill` uses `background: color-mix(in srgb, var(--card) 90%, transparent)`, `color: var(--ink)` and a `0 0 0 1px var(--rule)` ring, with `var(--paper-sunk)` on hover. Inside the terminal: `rgba(255,255,255,.06)` with `#e6edf3` text and a `rgba(255,255,255,.18)` ring. Pills that stay white in dark mode were a bug Amogh flagged. Don't reintroduce it.

## 12. Plain view sections

Match the prototype's plain view:

- Hero: the name at `clamp(52px, 9vw, 120px)`, 132px top padding.
- "A few things I've built" as a **collage** that mirrors the room's canvas sizes, not a uniform grid: `grid-template-columns: .74fr 1.15fr .66fr`, areas `"fto llm llm" "fto saw qna"`, gap 40px 32px. Each piece is a framed image (8px `#fbfbf9` mat). On hover it lifts 3px with a warm glow, and a blurred overlay shows the tags and a `Read more →` chip. At 860px or less it becomes one column in the order fto, llm, saw, qna.
- "Where I've worked": a rows list (when | role · org + line | where) with org logo tooltips.
- "Education and tools": a school card plus the stack chips.
- The dark contact panel with three scarlet wave strokes, the copy-email button and the footer (local Madison time).

The repo's homepage already has most of these. Reuse the existing components (`ExperienceRow`, `CopyEmail`, `ContactPanel`, `NameTooltip`, `marks.tsx`) and restyle them where they differ.

## 13. Reduced motion, phones, fallbacks

- **`prefers-reduced-motion: reduce`:** every camera move is instant (it lands at the target and then runs the action). No flicker loop, no swing, no caret blink, no card animation. The poster and halos snap to their targets. The synth keys hold a static glow.
- **Phones (640px or less):** plain view only. The room code doesn't run at all. The menu sheet replaces the nav.
- **No WebGL, or three.js fails to load:** plain view, with the view toggle hidden.
- **SEO:** all text exists in the HTML. The canvas is `aria-hidden`; the buttons carry the meaning.

## 14. Acceptance checklist

Check each item side by side with the reference.

- [ ] First paint shows the hero as real HTML on the iMac screen. Scroll or "Enter the room ↓" pulls back to the wide room in 1.6 s with no visible swap between the HTML and the 3D screen.
- [ ] The nav links don't move at all when you toggle between plain view and room view (measure their x positions).
- [ ] Only one nav link is ever highlighted, in every view and through every transition.
- [ ] In room view: Projects opens Find the Outfit on its canvas, Experience flies to the screen and opens the terminal, and About flies to the neon sign and opens the about card.
- [ ] Experience → About, About → Experience, Projects ↔ About, and the hero screen → any canvas all fly directly, with no stop at the wide shot.
- [ ] The project card has prev / next with a count, wraps around, works with the arrow keys, and keeps focus on the step button. The camera glides behind the card.
- [ ] No project codes ("p-01" and so on) appear anywhere on screen.
- [ ] In dark mode, the back, prev, next and exit pills are themed. None of them stays white.
- [ ] Night mode turns on the neon, the lamp, the canvas halos and the LED strips, the moon, the dark sky and SAW's dark screenshot. Day mode turns them all off.
- [ ] Every object has its exact hover label and its action, and is reachable by keyboard.
- [ ] Reduced motion, phone layout and the no-WebGL fallback all behave as described in section 13.
- [ ] All copy comes from `src/content/`. No console errors.

## 15. Not decided yet (ask Amogh, don't guess)

1. Whether the room objects' hover labels ("window · night mode" and the others) should stay, or be trimmed like the project codes were.
2. Whether the synth should ever play a clip of his music, and which track.
3. Whether to swap the primitive-built instruments for low-poly models later (see the asset tables in `room-concept-handoff.md`).
