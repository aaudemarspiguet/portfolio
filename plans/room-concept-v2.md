# Review & Iteration v2: The "Studio Loft" Portfolio Homepage

Companion review and v2 iteration on [room-concept-handoff.md](file:///c:/Users/amogh/projects/portfolio/plans/room-concept-handoff.md), paired with the saved interactive 3D prototype [studio-loft-prototype.html](file:///c:/Users/amogh/projects/portfolio/plans/studio-loft-prototype.html).

## 0. Saved Decisions (2026-11-24)

| Topic | Decision |
|---|---|
| **3D Route & Assets** | **Route B-Lite:** real-time single-camera 3D scene using bespoke/generated low-poly assets (batch low-poly generation job planned next) + real project screenshots as canvas textures. |
| **Green Rug** | Virgil Abloh × IKEA MARKERAD `"WET GRASS"` green shag rug (`~2.9 m × 1.9 m × 2.8 cm` pile), keeping the white `"WET GRASS"` lettering (removed the `"no brand text"` restriction from [room-concept-handoff.md](file:///c:/Users/amogh/projects/portfolio/plans/room-concept-handoff.md)). |
| **Canvas Aspect Ratios** | **1 tall portrait** (`p-01`, 9:19), **1 wide** (`p-03`, 2:1), **2 landscapes** (`p-02` 4:3 swapping light/dark with theme, `p-04` 16:10) — matched to `public/projects/`. |
| **Hero First Paint** | Full-bleed real HTML hero (`Enter the room ↓` + `Skip the room → list` above the fold); monitor stays live in 3D after pulling back. |
| **UI Bridge** | Plotter Callout HUD (scarlet target dot + Geist Mono label + corner crop marks) inside the 3D room, connecting to the Plotter Notebook list & case studies. |
| **Still Open** | Palette (`Notebook` vs `Blueprint`), phone mode (`3-bay swipeable wall` vs `collapsed + list`), synth audio track, and *Slime Season 2* print photo. |

---

## 1. Review of `room-concept-handoff.md`

The handoff nails the core technical lesson (**one real 3D camera, never per-object fake 2D perspective**) and the core product rule (**the room must never outrank the work**). However, comparing the brief against the actual assets in `public/projects/`, `src/content/projects.ts`, and `src/styles/tokens.css` reveals **six concrete friction points** that need to be resolved before production implementation:

### A. Asset aspect-ratio mismatch on the salon wall (Section 4 vs. Section 7)
The handoff specifies *"4 framed canvases in different sizes and aspect ratios (one wide, one landscape, two portrait)"*.
Measuring the actual files in `public/projects/` gives:
- `p-01` (`find-the-outfit/06-you-found-it.jpg`): `657 × 1421` → **tall portrait (~9:19.5)**
- `p-02` (`saw/06-bob-replies-light.jpg` & `-dark.jpg`): `1600 × 1200` → **4:3 landscape** (and already has a dark variant!)
- `p-03` (`llm-ablations/04-team-matrix-gemma.png`): `1784 × 882` → **2:1 wide landscape**
- `p-04` (`qna/04-student-ai-answer-with-sources.jpg`): `1280 × 800` → **16:10 landscape**

**Fix:** Re-compose the salon collage as **1 tall portrait (`p-01`), 1 wide (`p-03`), and 2 medium landscapes (`p-02`, `p-04`)** so zero screenshots are cropped off-axis. Wire `p-02` to swap `-light.jpg` / `-dark.jpg` automatically with the room's day/night state.

### B. First-paint "monitor box" risk
Opening *"zoomed all the way into a desktop computer screen"* risks two UX regressions:
1. If the monitor bezel or fake terminal chrome crowds the first paint, a recruiter can feel trapped inside a novelty UI before seeing the work.
2. Scroll-jacking the camera pull-back on laptops/phones can conflict with visitors trying to scroll straight to the list.

**Fix:**
- First paint is **full-bleed, real HTML** matching the Lab/Plotter Notebook layout, framed only by subtle corner crop marks and a hairline monitor edge that expands as the camera dollies out.
- Put two explicit actions above the fold: `Enter the room ↓` (triggers the 0.7s camera pull-back) and `Skip the room → list` (always jumps straight to the 2×2 grid + experience list).
- Keep the monitor screen **live** in the 3D scene after zooming out so it stays legible as a tiny desktop display rather than turning into a blank grey quad.

### C. Back-wall congestion & sightlines
At eye height `1.6 m` facing the back wall, placing the L-desk, studio monitors, hero monitor, upper-left neon sign, crooked poster, 4 canvases, two-tier synth rack, and floor lamp along one plane risks overlap on `1280×720` or `1440×900` viewports.

**Fix — 3-Bay Architectural Zoning (7.56 m × 3.3 m × 6.0 m room, camera at `(0.0, 1.56, 3.55)`, FOV `54°`):**
1. **Left Bay (`x ∈ [-3.78, -0.95]`):** Left-wall 2×3 steel window (`z ∈ [-2.05, -0.35]`) casting a diagonal sun/moon shaft across the floor + L-desk (`y = 0.75 m`) + hero monitor & angled nearfields + PC tower below.
2. **Center-Right Bay (`x ∈ [-0.85, +2.25]`):** Upper-left `"amogh's space"` neon sign (`x = -2.12, y = 2.42`) above the workstation with ≥ 0.45 m clearance; crooked *Slime Season 2* print (`x = -0.82, y = 1.82`) bridging desk and gallery; 4 framed canvases (`p-01` at `(0.24, 1.88)`, `p-03` at `(1.42, 2.18)`, `p-02` at `(1.24, 1.48)`, `p-04` at `(0.44, 0.96)` — clean `≥ 0.17 m` vertical separation).
3. **Right Bay (`x ∈ [+2.35, +3.78]`):** Two-tier synth stand angled `-12°` toward center so keyboards and panels read clearly from the main camera (`Model D` + `Prophet-5` upper tier at `y = 1.08 m`, `Juno-60` lower tier at `y = 0.78 m`), floor lamp in the back-right corner (`x = 3.54, z = -2.08`), and Rickenbacker 360 on the right return wall (`x = 3.74, z = -1.20`).
4. **Center Floor (`y = 0.00..0.028 m`):** Virgil Abloh × IKEA MARKERAD `"WET GRASS"` rug (`x ∈ [-1.45, +1.45]`, `z ∈ [-1.20, +0.70]`).

### D. Bridging "Studio Loft" and "Plotter Notebook"
Inner pages use the **Plotter Notebook** language (crop marks, dimension lines, hand-hatched charts, waveform divider, Geist Mono data). If the 3D room has a totally different UI chrome, jumping from room to case study feels disjointed.

**Fix:** Use a **Plotter Callout HUD** inside the 3D room: hovering or keyboard-focusing any object projects a scarlet target dot, an angled architectural leader line, and a Geist Mono pill (`p-01 · find the outfit →`, `synth rack · ▶ jam`, `desktop · experience`) plus corner crop-mark brackets around the active frame.

### E. Route A vs. Route B + 3D Asset Licensing (Section 3 & 8)
- Pure **Route A** (zooming a 2D pre-render) breaks down when dollying into angled canvases or the desktop monitor, and cannot animate individual synth keys, LED meters, or a swinging guitar cleanly.
- Conversely, buying/licensing 5 high-poly instrument meshes (Section 8) adds ~$75–100, editorial/IP restrictions on branded instruments, and multi-MB glTF payloads.
- **Recommendation (Route B-Lite):** Build the architectural shell, frames, desk, and instruments in **clean stylized low-poly 3D** (Three.js / R3F or custom WebGL), using **real project screenshots** as canvas textures and **Amogh's own photos** (cutout textures on 3D planes) for the *Slime Season 2* print and optional instrument faceplates. Zero licensing ambiguity, tiny bundle, true 0.7s camera dollies, and crisp 60fps interaction.

### F. Phone (`375px`) & Palette Contrast Check
- **Phone (`< 640px`):** A 1.6 m eye-height wide loft cropped to `375×812` cuts off both the left window and right synth rack. Recommended phone layout: **Hero → Horizontally swipeable 3-bay wall strip (Workstation / Gallery / Music) with snap dots → Full Plotter Notebook list below**, with an alternative **Collapsed Gallery + List** option prototyped side-by-side.
- **Blueprint Palette (`#eef4f8 / #023047 / #219ebc / #fb8500`):** `#fb8500` orange on `#eef4f8` paper is ~2.4:1 contrast — below WCAG AA 4.5:1 for small text. Apply the exact same rule as Scarlet (`#FF3B1F`): marks/glows/≥24px display only, never small text or fills behind text. Warm `#f4f3ef` paper + `#FF3B1F` scarlet also harmonizes noticeably better with brick, green shag rug, and Fireglo guitar tones.

### G. Green Rug Asset Check (SketchUp 3D Warehouse)
Evaluated `Virgil Abloh x IKEA MARKERAD WET GRASS Green OFF WHITE Rug` by `Mahbod R.` (`54844878-48ea-4ab9-b5fa-858fb32309b0`): **Don't embed directly; recreate lightweight.**
- **Look & copy:** Keeps the white `"WET GRASS"` lettering on the deep-green shag rug per Amogh's preference.
- **Why not the raw SketchUp file:** `4.7 MB` file size (`Bounds: 2 × 3 × 0`, `Polygons: 0`, includes 8 unused SketchUp "Laura" figure materials) for a zero-thickness rectangle, no explicit open license, and 3D Warehouse prohibits third-party site embeds.
- **Better path:** In Route B-Lite (Three.js/R3F) or Route A (Blender), build a `~2.0 × 2.9 m` beveled plane (`~1.5 cm` pile height) with a `< 50 KB` tileable green shag texture + `"WET GRASS"` lettering so it loads fast and renders with real pile depth.

---

## 2. Prototype Controls & What to Test

Open the interactive prototype (`studio-loft-prototype.html`) to test every decision live:
1. **Camera Rig:** Click `Enter the room ↓` (or scroll) to dolly from the live HTML hero screen out into the 3D studio loft; click `↺ Back to screen` to dolly back.
2. **All 7 Room Interactions:**
   - **Desktop monitor:** Dollies in and opens `amogh@loft ~ % cat experience/*.txt` with all 4 real roles + education and an `exit` button.
   - **4 Project canvases (`p-01`..`p-04`):** Dollies to the canvas and opens a Plotter Notebook case-study peek (with real metrics, stack, and a hand-hatched / SVG chart).
   - **Left window:** Toggles Day (sunbeam across the floor) ↔ Night (moon, stars, neon bloom, warm floor lamp pool, SAW dark screenshot).
   - **Neon sign (`amogh's space`):** Triggers a realistic neon starter flicker.
   - **Synth rack:** Animates key highlights + LED level meters and plays a synthesized Juno-style chord jam via Web Audio API (click again to stop; never autoplays).
   - **Rickenbacker guitar:** Swings on its wall hook with damped harmonic motion + gentle strum chord.
   - **Slime Season 2 poster:** Straightens from `-4.5°` to `0°`.
3. **Open-Decision Toggles in the Top Bar:**
   - **Palette:** `Notebook (#f4f3ef / #0066cc / #FF3B1F)` vs `Blueprint (#eef4f8 / #023047 / #219ebc / #fb8500)`
   - **Viewport:** `Desktop 16:9` vs `Phone 375px` (with toggle between *3-Bay Panning Wall* and *Collapsed Gallery + List*)
   - **Blueprint Specs Tab:** Annotated top-down floorplan + front elevation in meters, showing camera frustum and exact clearances.
   - **Reduced Motion Toggle:** Skips camera dollies and ambient animations immediately.
