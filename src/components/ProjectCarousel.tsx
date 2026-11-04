"use client";

/*
  Project carousel. Ported from ObsidianUI's Parallax Slider
  (https://github.com/Atharvsinh-codez/ObsidianUI, components/block/parallax-slider)
  to plain CSS (.ln-carousel in components.css) with no new dependencies.

  Changes from upstream: slides are project cards (cover frame + text) clipped
  to the content column. One card is always centered and lifted toward the
  viewer, with its neighbors scaled back. Every gesture (swipe, drag, sideways
  scroll, arrow key, button) moves exactly one card and settles on a spring
  that overshoots slightly, in place of the upstream free-scrolling lerp.
  Covers may be video.

  MIT License

  Copyright (c) 2026 ObsidianUI

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { hasFlag, type Project } from "@/content/projects";
import { ProjectCardBody, ProjectCover } from "./ProjectCard";

// Spring: about a 450ms period, damped to overshoot by roughly 5% of a card.
const STIFFNESS = 0.000195; // per ms²
const DAMPING = 0.019; // per ms
const FLICK_SPEED = 0.25; // px per ms; a release faster than this moves a whole card
const VELOCITY_WINDOW = 90; // ms of pointer history used for the release speed
const DRAG_THRESHOLD = 6;
const WHEEL_THRESHOLD = 30; // px of sideways scroll before a step
const WHEEL_QUIET = 180; // ms without wheel events that ends a trackpad gesture
// Depth: side cards shrink and fade toward this, the centered card lifts by LIFT px.
const SIDE_SCALE = 0.9;
const SIDE_OPACITY = 0.6;
const LIFT = 8;
const PARALLAX = 0.12;
const ZOOM = 1.25;
// Copies sit on both sides of the readable copy, so the strip can wrap without a visible jump.
const LEAD_COPIES = 3;
const MIN_COPIES = 8;

type Api = { step: (direction: 1 | -1) => void };

function parseFocus(focus: string | undefined): [number, number] {
  const [x, y = x] = (focus ?? "").trim().split(/\s+/).map((part) => parseFloat(part) / 100);
  const clamp = (value: number | undefined) => (value === undefined || Number.isNaN(value) ? 0.5 : Math.min(1, Math.max(0, value)));
  return [clamp(x), clamp(y)];
}

function naturalSize(el: HTMLImageElement | HTMLVideoElement | null): [number, number] {
  if (!el) return [0, 0];
  return el instanceof HTMLVideoElement ? [el.videoWidth, el.videoHeight] : [el.naturalWidth, el.naturalHeight];
}

export function ProjectCarousel({ projects, header, label = "Projects" }: { projects: Project[]; header?: ReactNode; label?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  // Which card is centered, kept across re-runs of the effect. Starts on the first current project.
  const indexRef = useRef(Math.max(0, projects.findIndex((p) => hasFlag(p, "current"))));
  const [copies, setCopies] = useState(MIN_COPIES);
  const count = projects.length;

  useEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!root || !viewport || !track || count === 0) return;

    const slides = Array.from(track.children) as HTMLElement[];
    const frames = slides.map((slide) => slide.querySelector<HTMLElement>("[data-parallax-frame]"));
    const media = slides.map((slide) => slide.querySelector<HTMLImageElement | HTMLVideoElement>("[data-parallax-media]"));
    // How far each cover can shift before its edge shows inside the frame.
    const room = media.map(() => ({ left: 0, right: 0 }));
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const s = {
      x: 0, v: 0, target: 0, width: 0, slideWidth: 0, frameWidth: 0, frameHeight: 0, pitch: 0, sequence: 0,
      // Track position that centers the first card of the readable copy.
      home: 0,
      frame: 0, last: 0,
      pointer: null as number | null, startX: 0, startClient: 0, dragged: false,
      samples: [] as { t: number; x: number }[],
      wheel: 0, wheelLocked: false,
      reduce: motionQuery.matches,
    };
    let releaseTimer = 0;
    let wheelTimer = 0;

    // Card index (in readable-copy terms, may be fractional) at track position x.
    const indexAt = (x: number) => (s.home - x) / s.pitch;
    const positionOf = (index: number) => s.home - index * s.pitch;

    // Keeps the strip inside the range the copies cover, shifting everything by whole
    // sequences so nothing visibly moves. Readable positions (0 to count) never wrap.
    const shift = (by: number) => {
      s.x += by;
      s.target += by;
      s.startX += by;
    };
    const wrap = () => {
      if (!s.sequence) return;
      while (s.x > s.home + s.sequence) shift(-s.sequence);
      while (s.x <= s.home - 2 * s.sequence) shift(s.sequence);
    };

    const paintMedia = (index: number, distance: number) => {
      const el = media[index];
      if (!el) return;
      const drift = s.reduce ? 0 : distance * -PARALLAX;
      const offset = Math.max(-room[index].right, Math.min(room[index].left, drift));
      el.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const paint = () => {
      track.style.transform = `translate3d(${s.x}px, 0, 0)`;
      const reach = s.width / 2 + s.slideWidth + s.pitch;
      for (let i = 0; i < slides.length; i++) {
        const distance = s.x + i * s.pitch + s.slideWidth / 2 - s.width / 2;
        if (Math.abs(distance) > reach) continue;
        // 0 at the center, 1 one card away.
        const away = Math.min(1, Math.abs(distance) / s.pitch);
        const near = 1 - away;
        const scale = s.reduce ? 1 : 1 - (1 - SIDE_SCALE) * away;
        const slide = slides[i];
        // Scale toward the center so the gap to the centered card stays even.
        slide.style.transformOrigin = distance < 0 ? "100% 50%" : "0% 50%";
        slide.style.transform = `translate3d(0, ${-LIFT * near}px, 0) scale(${scale})`;
        slide.style.opacity = String(1 - (1 - SIDE_OPACITY) * away);
        slide.style.setProperty("--lift", near.toFixed(3));
        slide.dataset.active = String(away < 0.5);
        paintMedia(i, distance);
      }
    };

    // Sizes the cover to fill its frame at its natural ratio, plus zoom, so the
    // part outside the frame is what the parallax reveals.
    const fit = (index: number) => {
      const el = media[index];
      const [naturalWidth, naturalHeight] = naturalSize(el);
      if (!el || !naturalWidth || !naturalHeight || !s.frameWidth) return;
      const { frameWidth, frameHeight } = s;
      const ratio = naturalWidth / naturalHeight;
      const width = Math.max(frameWidth, frameHeight * ratio) * ZOOM;
      const height = Math.max(frameHeight, frameWidth / ratio) * ZOOM;
      const [focusX, focusY] = parseFocus(el.dataset.focus);
      Object.assign(el.style, {
        width: `${width}px`, height: `${height}px`,
        left: `${(frameWidth - width) * focusX}px`, top: `${(frameHeight - height) * focusY}px`,
      });
      room[index] = { left: (width - frameWidth) * focusX, right: (width - frameWidth) * (1 - focusX) };
    };

    const step = (now: number) => {
      s.frame = 0;
      const dt = Math.min(32, now - (s.last || now - 16));
      s.last = now;
      if (s.pointer === null) {
        if (s.reduce) {
          s.x = s.target;
          s.v = 0;
        } else {
          // Semi-implicit Euler on a damped spring toward the target card.
          s.v += (STIFFNESS * (s.target - s.x) - DAMPING * s.v) * dt;
          s.x += s.v * dt;
          if (Math.abs(s.target - s.x) < 0.3 && Math.abs(s.v) < 0.01) {
            s.x = s.target;
            s.v = 0;
          }
        }
      }
      wrap();
      paint();
      if (s.pointer !== null || s.x !== s.target) s.frame = requestAnimationFrame(step);
      else s.last = 0;
    };

    const tick = () => {
      if (!s.frame) s.frame = requestAnimationFrame(step);
    };

    const settleOn = (index: number) => {
      s.target = positionOf(index);
      indexRef.current = ((index % count) + count) % count;
      tick();
    };

    // One card per press, counted from where the strip is heading, not where it is.
    const stepCards = (direction: 1 | -1) => {
      if (!s.pitch) return;
      settleOn(Math.round(indexAt(s.target)) + direction);
    };
    apiRef.current = { step: stepCards };

    const measure = () => {
      const hadPitch = s.pitch > 0;
      const at = hadPitch ? indexAt(s.x) : indexRef.current;
      const goal = hadPitch ? Math.round(indexAt(s.target)) : indexRef.current;
      // Computed sizes, not rects: slides are scaled, and rects would include that.
      const slideStyle = getComputedStyle(slides[0]);
      const frameStyle = frames[0] ? getComputedStyle(frames[0]) : null;
      s.width = viewport.clientWidth;
      s.slideWidth = parseFloat(slideStyle.width);
      s.pitch = s.slideWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
      s.frameWidth = frameStyle ? parseFloat(frameStyle.width) : 0;
      s.frameHeight = frameStyle ? parseFloat(frameStyle.height) : 0;
      s.sequence = s.pitch * count;
      if (!s.sequence) return;
      s.home = s.width / 2 - s.slideWidth / 2 - LEAD_COPIES * s.sequence;
      s.x = positionOf(at);
      s.target = positionOf(goal);
      s.v = 0;
      // The track must still cover the viewport at the far end of the wrap range.
      const needed = Math.max(MIN_COPIES, LEAD_COPIES + 3 + Math.ceil(s.width / s.sequence));
      if (needed > copies) setCopies(needed);
      media.forEach((_, index) => fit(index));
      wrap();
      paint();
      tick();
    };

    const onMediaReady = (event: Event) => {
      const index = media.indexOf(event.currentTarget as HTMLImageElement | HTMLVideoElement);
      if (index < 0) return;
      fit(index);
      paint();
    };

    // Sideways scrolls (trackpad swipes, shift + wheel) step one card per gesture.
    // Vertical wheel scrolling always scrolls the page.
    const onWheel = (event: WheelEvent) => {
      const sideways = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
      const vertical = event.shiftKey ? 0 : event.deltaY;
      if (!sideways || Math.abs(sideways) <= Math.abs(vertical)) return;
      event.preventDefault();
      // A trackpad keeps sending inertia events after the swipe; wait for quiet before the next step.
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        s.wheelLocked = false;
        s.wheel = 0;
      }, WHEEL_QUIET);
      if (s.wheelLocked) return;
      s.wheel += sideways * (event.deltaMode === 1 ? 16 : 1);
      if (Math.abs(s.wheel) < WHEEL_THRESHOLD) return;
      stepCards(s.wheel > 0 ? 1 : -1);
      s.wheelLocked = true;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || s.pointer !== null) return;
      window.clearTimeout(releaseTimer);
      s.pointer = event.pointerId;
      s.startX = s.x;
      s.startClient = event.clientX;
      s.dragged = false;
      s.v = 0;
      s.samples = [{ t: event.timeStamp, x: s.x }];
      tick();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== s.pointer) return;
      const moved = event.clientX - s.startClient;
      if (!s.dragged && Math.abs(moved) > DRAG_THRESHOLD) {
        s.dragged = true;
        root.dataset.dragging = "true";
      }
      if (!s.dragged) return;
      // The strip follows the pointer 1:1.
      s.x = s.startX + moved;
      s.target = s.x;
      s.samples.push({ t: event.timeStamp, x: s.x });
      while (s.samples.length > 2 && event.timeStamp - s.samples[0].t > VELOCITY_WINDOW) s.samples.shift();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== s.pointer) return;
      s.pointer = null;
      root.dataset.dragging = "false";
      if (!s.dragged) {
        tick();
        return;
      }
      const first = s.samples[0];
      const last = s.samples[s.samples.length - 1];
      const elapsed = Math.max(1, event.timeStamp - first.t);
      const velocity = event.timeStamp - last.t > VELOCITY_WINDOW ? 0 : (last.x - first.x) / elapsed;
      const at = indexAt(s.x);
      // A flick goes to the next card in its direction; a slow drag settles on the nearest one.
      let index = Math.round(at);
      if (velocity < -FLICK_SPEED) index = Math.floor(at) + 1;
      else if (velocity > FLICK_SPEED) index = Math.ceil(at) - 1;
      // The release speed carries into the spring, which is what makes it overshoot.
      s.v = velocity;
      settleOn(index);
      // Keeps the click that ends a drag from opening a card.
      releaseTimer = window.setTimeout(() => {
        s.dragged = false;
      }, 100);
    };

    const onClick = (event: MouseEvent) => {
      if (!s.dragged) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      stepCards(event.key === "ArrowLeft" ? -1 : 1);
    };

    // Tabbing to a card centers it.
    const onFocusIn = (event: FocusEvent) => {
      viewport.scrollLeft = 0;
      const slide = (event.target as HTMLElement).closest<HTMLElement>("[data-slide]");
      const index = slide ? slides.indexOf(slide) - LEAD_COPIES * count : -1;
      if (index < 0 || index >= count || !s.pitch) return;
      // Jump by whole sequences (invisible) so the strip takes the short way to the readable copy.
      while (indexAt(s.x) - index > count / 2) shift(s.sequence);
      while (indexAt(s.x) - index < -count / 2) shift(-s.sequence);
      settleOn(index);
    };

    const onMotionChange = () => {
      s.reduce = motionQuery.matches;
      tick();
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(viewport);
    media.forEach((el) => {
      el?.addEventListener("load", onMediaReady);
      el?.addEventListener("loadedmetadata", onMediaReady);
    });
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("pointerdown", onPointerDown);
    viewport.addEventListener("click", onClick, true);
    viewport.addEventListener("keydown", onKeyDown);
    viewport.addEventListener("focusin", onFocusIn);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      apiRef.current = null;
      cancelAnimationFrame(s.frame);
      window.clearTimeout(releaseTimer);
      window.clearTimeout(wheelTimer);
      resizeObserver.disconnect();
      media.forEach((el) => {
        el?.removeEventListener("load", onMediaReady);
        el?.removeEventListener("loadedmetadata", onMediaReady);
      });
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("pointerdown", onPointerDown);
      viewport.removeEventListener("click", onClick, true);
      viewport.removeEventListener("keydown", onKeyDown);
      viewport.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [count, copies]);

  return (
    <div ref={rootRef} className="ln-wrap ln-carousel" data-dragging="false">
      <div className="ln-carousel__bar">
        {header}
        <div className="ln-carousel__nav">
          <button type="button" className="ln-btn ln-carousel__btn" aria-label="Previous project" onClick={() => apiRef.current?.step(-1)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" /></svg>
          </button>
          <button type="button" className="ln-btn ln-carousel__btn" aria-label="Next project" onClick={() => apiRef.current?.step(1)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" /></svg>
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="ln-carousel__viewport"
        role="group"
        aria-roledescription="carousel"
        aria-label={`${label}. Swipe, drag, or use the arrow keys to browse.`}
        tabIndex={0}
      >
        <div ref={trackRef} className="ln-carousel__track">
          {Array.from({ length: copies }, (_, copy) =>
            projects.map((project, index) => {
              const readable = copy === LEAD_COPIES;
              return (
                <div
                  key={`${copy}-${project.slug}`}
                  data-slide=""
                  className="ln-carousel__slide"
                  role={readable ? "group" : undefined}
                  aria-roledescription={readable ? "slide" : undefined}
                  aria-label={readable ? `${index + 1} of ${count}` : undefined}
                  aria-hidden={readable ? undefined : true}
                >
                  <Link href={`/work/${project.slug}`} className="ln-card ln-card--media" draggable={false} tabIndex={readable ? undefined : -1}>
                    <ProjectCover project={project} decorative={!readable} parallax />
                    <ProjectCardBody project={project} />
                  </Link>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
