"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import * as THREE from "three";
import type { HomeProject } from "@/content/project-types";
import {
  playClick,
  playDiscSwap,
  playNeedleDrop,
  playNeedleLift,
  playSwitch,
  startVinylTexture,
  stopVinylTexture,
} from "@/lib/sfx";
import { toggleTheme, useTheme } from "../ThemeToggle";
import { useStudioView, type RoomNavKey } from "../StudioViewProvider";
import { buildRoomScene, disposeRoomScene, type RoomSceneRefs } from "./furniture";
import { clamp, easeInOutCubic, linearColor, mapRoomProjects, RECORD_TRACKS, smoothstep } from "./roomData";
import type { PeekState } from "./RoomPeeks";
import { TypedLine } from "./TypedLine";
import { drawHeroToCanvas, drawIdleScreen } from "./textures";
import { msToNextMinute } from "@/lib/clock";

export type RoomActions = {
  enterRoom: () => void;
  backToScreen: (after?: () => void) => void;
  openTerminal: () => void;
  goToProject: (index: number, dir?: 1 | -1) => void;
  goToAll: () => void;
  closePeekToWide: () => void;
  nav: (key: RoomNavKey) => boolean;
};

type InteractiveObj = {
  key: string;
  label: string;
  direct?: boolean;
  hit: THREE.Object3D[];
  anchor: () => THREE.Object3D;
  act: () => void;
};

function resolveObjLabel(o: InteractiveObj, isDark: boolean): string {
  if (o.key === "window") {
    return isDark ? "window · day mode" : "window · night mode";
  }
  return o.label;
}

/**
 * The first-visit tour: a few steps, each spotlighting objects in the room (by their registry key)
 * while the rest dims and a note at the top of the stage says what they do. `canvases` lights every
 * project canvas.
 */
type TourStep = {
  focus: (portrait: boolean) => string[];
  canvases?: boolean;
  /** One short line in my voice, typed out on the note; keep it to one line on a wide stage. */
  text: (portrait: boolean) => string;
  /** A phrase in `text` that links to the plain view. */
  plainLink?: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    // The hello: nothing lit yet, the whole room in view.
    focus: () => [],
    text: () => "Welcome to my studio. Here's a quick tour.",
  },
  {
    canvases: true,
    focus: () => [],
    text: () => "My projects hang on the wall. Click one.",
  },
  {
    // On phones the desk phone is the way back to the hero; on wide screens it's the iMac.
    focus: (portrait) => [portrait ? "phone" : "imac"],
    text: (portrait) => `My ${portrait ? "phone" : "desktop"} takes you back to the start.`,
  },
  {
    // A phone's narrow frame can't hold the whole room, so it skips the neon on the far wall and
    // lights the toys on the right: the record player, the synths and the guitar above them.
    focus: (portrait) => (portrait ? ["turntable", "rack", "guitar"] : ["neon", "guitar", "rack", "turntable"]),
    text: () => "Most things in here do something. Try them.",
  },
  {
    focus: () => ["window"],
    text: () => "The window switches day and night.",
  },
  {
    focus: () => [],
    text: () => "Explore away, or see the plain version.",
    plainLink: "plain version",
  },
];

const TOUR_STORAGE_KEY = "roomTour";

function readTourSeen(): boolean {
  try {
    return localStorage.getItem(TOUR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveTourSeen() {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "1");
  } catch {}
}

function subscribeFinePointer(onChange: () => void) {
  const mq = window.matchMedia?.("(pointer: fine)");
  mq?.addEventListener?.("change", onChange);
  return () => mq?.removeEventListener?.("change", onChange);
}

function getFinePointerSnapshot() {
  return window.matchMedia?.("(pointer: fine)").matches ?? false;
}

export default function StudioRoom({
  projects,
  stageRef,
  heroRef,
  heroScreenRef,
  peek,
  onOpenPeek,
  onClosePeekState,
  onSwitchToPlain,
  onProgress,
  onReady,
  onWebglFailed,
  registerActions,
}: {
  projects: HomeProject[];
  stageRef: RefObject<HTMLElement | null>;
  heroRef: RefObject<HTMLDivElement | null>;
  heroScreenRef: RefObject<HTMLDivElement | null>;
  peek: PeekState;
  onOpenPeek: (next: PeekState, section: RoomNavKey | null) => void;
  onClosePeekState: () => void;
  onSwitchToPlain: () => void;
  onProgress?: (ratio: number) => void;
  onReady: () => void;
  onWebglFailed: () => void;
  registerActions: (actions: RoomActions | null) => void;
}) {
  const { view } = useStudioView();
  const theme = useTheme();
  const isDarkRef = useRef(theme === "dark");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const [enteredState, setEnteredState] = useState(false);
  const [tour, setTour] = useState<{ step: number; portrait: boolean } | null>(null);
  const [keyObjects, setKeyObjects] = useState<InteractiveObj[]>([]);
  const [benchText, setBenchText] = useState<string | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [deckPlaying, setDeckPlaying] = useState(false);
  const isFinePointer = useSyncExternalStore(subscribeFinePointer, getFinePointerSnapshot, () => false);

  const peekRef = useRef<PeekState>(peek);
  const callbacksRef = useRef({
    onOpenPeek,
    onClosePeekState,
    onSwitchToPlain,
    onProgress,
    onReady,
    onWebglFailed,
  });

  useEffect(() => {
    isDarkRef.current = theme === "dark";
  }, [theme]);

  useEffect(() => {
    peekRef.current = peek;
  }, [peek]);

  useEffect(() => {
    callbacksRef.current = {
      onOpenPeek,
      onClosePeekState,
      onSwitchToPlain,
      onProgress,
      onReady,
      onWebglFailed,
    };
  }, [onOpenPeek, onClosePeekState, onSwitchToPlain, onProgress, onReady, onWebglFailed]);

  const applyThemeRef = useRef<((dark: boolean) => void) | null>(null);
  const tourNextRef = useRef<(() => void) | null>(null);
  const tourEndRef = useRef<((recenter?: boolean) => void) | null>(null);
  const tourReplayRef = useRef<(() => void) | null>(null);
  const backToScreenRef = useRef<(() => void) | null>(null);
  const showTagForObjRef = useRef<((o: InteractiveObj) => void) | null>(null);
  const hideTagRef = useRef<(() => void) | null>(null);
  const runKeyObjectRef = useRef<((o: InteractiveObj) => void) | null>(null);
  const syncDeckRef = useRef<((nextTrack: number, shouldPlay: boolean) => void) | null>(null);
  const stopInstrumentsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isFinePointer) document.documentElement.classList.add("ln-dotcursor");
    else document.documentElement.classList.remove("ln-dotcursor");
    return () => {
      document.documentElement.classList.remove("ln-dotcursor");
    };
  }, [isFinePointer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const hero = heroRef.current;
    const heroScreenEl = heroScreenRef.current;
    if (!canvas || !stage || !hero || !heroScreenEl) return;

    hero.removeAttribute("data-gone");
    hero.style.transform = "";
    hero.style.opacity = "";
    hero.style.transition = "";
    hero.style.pointerEvents = "";

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    } catch {
      callbacksRef.current.onWebglFailed();
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const benchMode = urlParams.get("bench") === "1";
    const dprOverride = urlParams.get("dpr");
    const isCoarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const maxDpr = dprOverride ? Number(dprOverride) || 2 : isCoarse ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;

    let shadowDirty = true;
    let shadowRedraws = 0;
    let needsFrame = true;
    function renderOnce() {
      needsFrame = true;
    }

    callbacksRef.current.onProgress?.(0.45);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 60);
    const WIDE = {
      pos: new THREE.Vector3(0.1, 1.6, 4.1),
      look: new THREE.Vector3(0, 1.52, -2),
    };

    let sceneBuilt = false;
    let texturesDone = false;
    let fontsDone = !document.fonts?.load;
    let readyEmitted = false;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;
    let fontTimer: ReturnType<typeof setTimeout> | null = null;

    const tryFinishLoad = () => {
      if (readyEmitted || !sceneBuilt) return;
      if (!texturesDone || !fontsDone) return;
      readyEmitted = true;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (fontTimer) clearTimeout(fontTimer);
      redrawHero();
      redrawNeon();
      if (shadowDirty) {
        renderer.shadowMap.needsUpdate = true;
        shadowDirty = false;
        shadowRedraws++;
      }
      renderer.render(scene, camera);
      needsFrame = false;
      callbacksRef.current.onProgress?.(1);
      callbacksRef.current.onReady();
    };

    const roomProjects = mapRoomProjects(projects);
    const refs: RoomSceneRefs = buildRoomScene(
      scene,
      roomProjects,
      renderOnce,
      (loaded, total) => {
        const ratio = total > 0 ? loaded / total : 1;
        callbacksRef.current.onProgress?.(0.65 + 0.3 * ratio);
        if (loaded >= total) {
          texturesDone = true;
          tryFinishLoad();
        }
      },
    );
    const { SCR, screen, screenMat, PHONE_SCR, phoneScreen, phoneScreenMat, canvasMeshes } = refs;

    // Portrait stages (phones) put the hero on the desk phone; wide stages keep it on the iMac.
    function stageIsPortrait() {
      const r = stage?.getBoundingClientRect();
      return !!r && r.width > 0 && r.height > 0 && r.width / r.height < 1;
    }
    let isPortrait = stageIsPortrait();
    function heroTarget() {
      return isPortrait
        ? { mesh: phoneScreen, dims: PHONE_SCR, mat: phoneScreenMat, idle: screenMat, idleKind: "desktop" as const }
        : { mesh: screen, dims: SCR, mat: screenMat, idle: phoneScreenMat, idleKind: "phone" as const };
    }

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let heroTex: THREE.CanvasTexture | null = null;
    let idleTex: THREE.CanvasTexture | null = null;
    function redrawIdle() {
      if (!heroScreenEl) return;
      const target = heroTarget();
      const st = getComputedStyle(heroScreenEl);
      const nextIdle = drawIdleScreen(target.idleKind, st.backgroundColor, st.color, idleTex);
      if (idleTex && idleTex !== nextIdle) idleTex.dispose();
      idleTex = nextIdle;
      if (target.idle.map !== idleTex) {
        target.idle.map = idleTex;
        target.idle.needsUpdate = true;
      }
      renderOnce();
    }
    function redrawHero() {
      if (!heroScreenEl || hero?.style.transform) return;
      const nextTex = drawHeroToCanvas(heroScreenEl);
      if (!nextTex) return;
      const target = heroTarget();
      if (heroTex) heroTex.dispose();
      heroTex = nextTex;
      target.mat.map = heroTex;
      target.mat.needsUpdate = true;
      redrawIdle();
    }

    // The idle screen's lock-screen clock shows the viewer's real time, so redraw it on the minute.
    let clockTimer: ReturnType<typeof setTimeout> | null = null;
    function tickClock() {
      clockTimer = setTimeout(() => {
        if (!document.hidden) redrawIdle();
        tickClock();
      }, msToNextMinute());
    }
    tickClock();
    // Hidden tabs skip the minute redraw, so catch the clock up as soon as the tab is shown again.
    function onVisibility() {
      if (!document.hidden) redrawIdle();
    }
    document.addEventListener("visibilitychange", onVisibility);

    function redrawNeon() {
      const neonFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-neon").trim();
      refs.updateNeonTexture(neonFamily || undefined);
      renderOnce();
    }

    redrawHero();
    redrawNeon();
    if (document.fonts?.load) {
      fontTimer = setTimeout(() => {
        fontsDone = true;
        tryFinishLoad();
      }, 450);
      Promise.all([
        document.fonts.load("170px Neonderthaw"),
        document.fonts.load("500 150px Inter"),
        document.fonts.load("500 30px 'Geist Mono'"),
      ])
        .then(() => {
          fontsDone = true;
          redrawHero();
          redrawNeon();
          tryFinishLoad();
        })
        .catch(() => {
          fontsDone = true;
          tryFinishLoad();
        });
    }

    // A shadowed light costs a shadow-map lookup on every pixel of every frame, so phones (already
    // capped at 1.5x DPR) keep the fan light unshadowed; the lamp and sun still cast theirs.
    refs.fanLight.castShadow = !isCoarse;

    /* Day / Night theme synchronization */
    let flickerUntil = 0;
    function applyTheme(dark: boolean) {
      shadowDirty = true;
      renderer.setClearColor(linearColor(dark ? 0x07080c : 0xbfd8ef));
      refs.skyMat.color.copy(linearColor(dark ? 0x0d1733 : 0x9fd0ff));
      refs.moon.visible = dark;
      refs.sun.intensity = (dark ? 0.12 : 1.5) * Math.PI;
      refs.sun.color.copy(linearColor(dark ? 0x7d93c9 : 0xfff1d6));
      refs.hemi.intensity = (dark ? 0.1 : 0.75) * Math.PI;
      refs.hemi.color.copy(linearColor(dark ? 0x4b5a86 : 0xe8eef6));
      refs.ambient.intensity = (dark ? 0.03 : 0.15) * Math.PI;

      refs.lampLight.intensity = dark ? 2.6 : 0;
      refs.lampSpot.intensity = dark ? 7.5 : 0;
      refs.shadeMat.emissive.copy(linearColor(dark ? 0x3a2410 : 0x000000));
      refs.bulbMat.color.copy(linearColor(dark ? 0xfff0d2 : 0x77777c));
      refs.shadeInnerMat.color.copy(linearColor(dark ? 0xffc77a : 0x55555a));

      refs.neonLight.intensity = dark ? 2.4 : 0;
      refs.neonMat.emissive.copy(linearColor(dark ? 0xff5a3c : 0x000000));
      refs.neonMat.emissiveIntensity = dark ? 3 : 0;
      refs.neonMat.color.copy(linearColor(dark ? 0xffd6cc : 0x8f8a83));

      refs.screenGlow.intensity = dark ? 1.1 : 0;
      refs.bowlMat.emissive.copy(linearColor(dark ? 0xffe2b0 : 0x000000));
      refs.fanLight.intensity = dark ? 1.6 : 0;

      roomProjects.forEach(({ project }) => {
        const entry = canvasMeshes[project.slug];
        (entry.strip.material as THREE.MeshBasicMaterial).color.copy(linearColor(dark ? 0xfff1dc : 0x55555a));
        if (entry.dark) {
          (entry.face.material as THREE.MeshStandardMaterial).map = dark ? entry.dark : entry.light;
          (entry.face.material as THREE.MeshStandardMaterial).needsUpdate = true;
        }
      });

      redrawHero();
      renderOnce();
    }
    applyThemeRef.current = applyTheme;
    applyTheme(isDarkRef.current);

    /* Camera & hero ride state */
    const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
    let tween: {
      from: { pos: THREE.Vector3; look: THREE.Vector3 };
      to: { pos: THREE.Vector3; look: THREE.Vector3 };
      t0: number;
      ms: number;
      step?: (e: number, k: number) => void;
      done: () => void;
    } | null = null;
    let busy = false;
    let entered = false;
    let heroBox: { w: number; h: number; stageH: number } | null = null;

    const look = { yaw: 0, pitch: 0, dragYaw: 0, dragPitch: 0, resting: false };

    // Zoom narrows the lens instead of moving the camera, so it can never push through a wall.
    // It only applies while resting in the room; any fly-in eases it back to 1.
    let baseFov = 50;
    const zoom = { cur: 1, want: 1 };
    const MAX_ZOOM = 1.8;
    function applyFov() {
      const half = Math.atan(Math.tan(THREE.MathUtils.degToRad(baseFov / 2)) / zoom.cur);
      camera.fov = THREE.MathUtils.radToDeg(2 * half);
      camera.updateProjectionMatrix();
    }
    function zoomBy(k: number) {
      zoom.want = clamp(zoom.want * k, 1, MAX_ZOOM);
      hideTag();
      renderOnce();
    }
    const Y_AXIS = new THREE.Vector3(0, 1, 0);

    function layoutHero() {
      if (!stage || !heroScreenEl) return;
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const pad = 14;
      const aspect = SCR.w / SCR.h;
      const w = r.width - 2 * pad;
      const h = r.height - 2 * pad;
      isPortrait = r.width / r.height < 1;
      if (isPortrait) {
        heroBox = null;
        return;
      }
      const bw = Math.min(w, h * aspect);
      const bh = bw / aspect;
      heroBox = { w: bw, h: bh, stageH: r.height };
    }

    function closeUp() {
      const { mesh, dims } = heroTarget();
      const p = new THREE.Vector3();
      const q = new THREE.Vector3();
      mesh.getWorldPosition(p);
      mesh.getWorldDirection(q);
      const t = Math.tan(THREE.MathUtils.degToRad(baseFov / 2));
      const d = heroBox ? (dims.h * heroBox.stageH) / (2 * t * heroBox.h) : (dims.h / 2 / t) * 1.04;
      return { pos: p.clone().add(q.multiplyScalar(d)), look: p };
    }

    function setCam(t: { pos: THREE.Vector3; look: THREE.Vector3 }) {
      cam.pos.copy(t.pos);
      cam.look.copy(t.look);
      camera.position.copy(cam.pos);
      camera.lookAt(cam.look);
    }

    function moveTo(
      t: { pos: THREE.Vector3; look: THREE.Vector3 },
      ms: number,
      done?: () => void,
      step?: (e: number, k: number) => void,
    ) {
      if (reduced || !ms) {
        setCam(t);
        renderOnce();
        done?.();
        return;
      }
      busy = true;
      tween = {
        from: { pos: cam.pos.clone(), look: cam.look.clone() },
        to: t,
        t0: performance.now(),
        ms,
        step,
        done: () => {
          busy = false;
          done?.();
        },
      };
    }

    function screenMapping() {
      const { mesh, dims } = heroTarget();
      camera.updateMatrixWorld();
      mesh.updateMatrixWorld();
      const r = canvas!.getBoundingClientRect();
      const xs: number[] = [];
      const ys: number[] = [];
      [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].forEach(([cx, cy]) => {
        const v = new THREE.Vector3((cx * dims.w) / 2, (cy * dims.h) / 2, 0);
        mesh.localToWorld(v);
        v.project(camera);
        xs.push(((v.x + 1) / 2) * r.width);
        ys.push(((1 - v.y) / 2) * r.height);
      });
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const ex = heroScreenEl!.offsetLeft;
      const ey = heroScreenEl!.offsetTop;
      const ew = heroScreenEl!.offsetWidth || 1;
      const eh = heroScreenEl!.offsetHeight || 1;
      const sx = (maxX - minX) / ew;
      const sy = (maxY - minY) / eh;
      if (isPortrait) {
        // Uniform scale keeps portrait hero text crisp without horizontal squashing.
        const s = Math.min(sx, sy);
        const hcx = ex + ew / 2;
        const hcy = ey + eh / 2;
        const scx = (minX + maxX) / 2;
        const scy = (minY + maxY) / 2;
        return { sx: s, sy: s, tx: scx - hcx * s, ty: scy - hcy * s };
      }
      return { sx, sy, tx: minX - ex * sx, ty: minY - ey * sy };
    }

    function placeHero(m: { sx: number; sy: number; tx: number; ty: number }, amount: number, opacity: number) {
      if (!hero) return;
      const sx = 1 + (m.sx - 1) * amount;
      const sy = 1 + (m.sy - 1) * amount;
      hero.style.transformOrigin = "0 0";
      hero.style.transform = `translate(${(m.tx * amount).toFixed(2)}px,${(m.ty * amount).toFixed(2)}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
      hero.style.opacity = String(opacity);
    }

    function clearHeroStyle() {
      if (!hero) return;
      hero.style.transform = "";
      hero.style.opacity = "";
      hero.style.transition = "";
      hero.style.pointerEvents = "";
    }

    function toWide(ms: number, step?: ((e: number, k: number) => void) | null, after?: () => void) {
      moveTo(
        WIDE,
        ms,
        () => {
          look.yaw = 0;
          look.pitch = 0;
          look.dragYaw = 0;
          look.dragPitch = 0;
          look.resting = true;
          after?.();
        },
        step ?? undefined,
      );
    }

    function zoomTarget(mesh: THREE.Object3D, dist: number) {
      const p = new THREE.Vector3();
      const n = new THREE.Vector3();
      mesh.getWorldPosition(p);
      mesh.getWorldDirection(n);
      return { pos: p.clone().add(n.multiplyScalar(dist)), look: p };
    }

    function zoomTo(mesh: THREE.Object3D, dist: number, done?: () => void) {
      look.resting = false;
      moveTo(zoomTarget(mesh, dist), 750, done);
    }

    /* First-visit tour */
    // Each step spotlights its objects: the room dims except for a soft glow that follows each
    // object's outline. A half-size pass draws the targets white over a black copy of the room (so
    // anything standing in front of them still blocks the light), and a full-screen quad dims every
    // pixel that the blurred mask doesn't cover.
    const TOUR_LAYER = 7;
    const FOCUS_DIM = 0.62;
    let tourStep = -1;
    let tourTimer: ReturnType<typeof setTimeout> | null = null;
    let focusTargets: THREE.Object3D[] = [];
    const focus = { cur: 0, want: 0 };

    const maskRT = new THREE.WebGLRenderTarget(1, 1);
    const maskBlack = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const maskWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const dimMat = new THREE.ShaderMaterial({
      uniforms: {
        tMask: { value: maskRT.texture },
        uTexel: { value: new THREE.Vector2(1, 1) },
        uRadius: { value: 8 },
        uAlpha: { value: 0 },
      },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: `
        uniform sampler2D tMask;
        uniform vec2 uTexel;
        uniform float uRadius;
        uniform float uAlpha;
        varying vec2 vUv;
        void main() {
          float c = texture2D(tMask, vUv).r;
          // Three staggered rings of taps, weighted toward the centre: a cheap soft blur that spreads
          // the silhouette into a glow past its edge.
          float sum = 0.0;
          float total = 0.0;
          for (int ring = 1; ring <= 3; ring++) {
            float r = float(ring) / 3.0;
            float w = 1.25 - r;
            for (int i = 0; i < 16; i++) {
              float a = (float(i) + 0.5 * float(ring)) * 0.3926991;
              vec2 d = vec2(cos(a), sin(a)) * uTexel * uRadius * r;
              sum += texture2D(tMask, vUv + d).r * w;
              total += w;
            }
          }
          float lit = max(c, smoothstep(0.0, 0.5, sum / total));
          gl_FragColor = vec4(0.03, 0.03, 0.045, uAlpha * (1.0 - lit));
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const dimQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), dimMat);
    dimQuad.frustumCulled = false;
    const dimScene = new THREE.Scene();
    dimScene.add(dimQuad);
    const dimCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clearColor = new THREE.Color();

    function sizeFocusMask() {
      const db = renderer.getDrawingBufferSize(new THREE.Vector2());
      const w = Math.max(1, db.x >> 1);
      const h = Math.max(1, db.y >> 1);
      maskRT.setSize(w, h);
      dimMat.uniforms.uTexel.value.set(1 / w, 1 / h);
      // About 16 CSS pixels of glow, in half-size mask pixels.
      dimMat.uniforms.uRadius.value = (16 * dpr) / 2;
    }

    // Click targets are invisible boxes; the mask passes swap every material, so they'd be drawn.
    // Skip them, and light a hit box's parent (the guitar, the record player) instead of the box.
    function isHitBox(o: THREE.Object3D) {
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
      return Boolean((o as THREE.Mesh).isMesh && mat && !Array.isArray(mat) && !mat.visible);
    }
    let hitBoxes: THREE.Object3D[] | null = null;
    function visualOf(o: THREE.Object3D) {
      return isHitBox(o) && o.parent && o.parent !== scene ? o.parent : o;
    }
    // Some objects read as part of their furniture: the record player lights its whole console
    // (cabinet, legs and vinyl crate), one group further up.
    const FOCUS_WHOLE: Record<string, number> = { turntable: 1 };
    function focusOf(key: string, hit: THREE.Object3D) {
      let o = visualOf(hit);
      for (let up = FOCUS_WHOLE[key] ?? 0; up > 0 && o.parent && o.parent !== scene; up--) o = o.parent;
      return o;
    }

    function setFocusTargets(next: THREE.Object3D[]) {
      focusTargets.forEach((o) => o.traverse((c) => c.layers.disable(TOUR_LAYER)));
      focusTargets = next;
      focusTargets.forEach((o) => o.traverse((c) => c.layers.enable(TOUR_LAYER)));
    }

    function drawFocus() {
      if (focus.cur <= 0.001) return;
      const bg = scene.background;
      const autoClear = renderer.autoClear;
      renderer.getClearColor(clearColor);
      const clearAlpha = renderer.getClearAlpha();
      if (!hitBoxes) {
        const found: THREE.Object3D[] = [];
        scene.traverse((o) => {
          if (isHitBox(o) && o.visible) found.push(o);
        });
        hitBoxes = found;
      }
      hitBoxes.forEach((o) => (o.visible = false));
      scene.background = null;
      renderer.setRenderTarget(maskRT);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      renderer.autoClear = false;
      scene.overrideMaterial = maskBlack;
      renderer.render(scene, camera);
      scene.overrideMaterial = maskWhite;
      camera.layers.set(TOUR_LAYER);
      renderer.render(scene, camera);
      camera.layers.set(0);
      scene.overrideMaterial = null;
      hitBoxes.forEach((o) => (o.visible = true));
      scene.background = bg;
      renderer.setRenderTarget(null);
      renderer.setClearColor(clearColor, clearAlpha);
      dimMat.uniforms.uAlpha.value = focus.cur;
      renderer.render(dimScene, dimCam);
      renderer.autoClear = autoClear;
    }

    function clearFocus() {
      // The targets stay lit while the dim fades out; the render loop drops them once it's gone.
      focus.want = 0;
      needsFrame = true;
    }

    function showTourStep(i: number) {
      const step = TOUR_STEPS[i];
      if (!step) return;
      tourStep = i;
      const keys = step.focus(isPortrait);
      const meshes: THREE.Object3D[] = [
        ...(step.canvases ? roomProjects.map(({ project }) => canvasMeshes[project.slug].face) : []),
        ...keys.flatMap((k) => (objects.find((o) => o.key === k)?.hit ?? []).map((h) => focusOf(k, h))),
      ];
      if (meshes.length) {
        setFocusTargets(meshes);
        focus.want = FOCUS_DIM;
      } else {
        clearFocus();
      }
      const centre = new THREE.Vector3();
      meshes.forEach((m) => centre.add(new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3())));
      // Turn the view toward what this step lights, so it's in frame on a narrow stage.
      if (meshes.length && look.resting) {
        centre.divideScalar(meshes.length);
        const base = new THREE.Vector3().subVectors(WIDE.look, WIDE.pos);
        const to = new THREE.Vector3().subVectors(centre, WIDE.pos);
        // The room faces -z, where atan2 jumps between +π and -π, so wrap the difference.
        let yaw = Math.atan2(to.x, to.z) - Math.atan2(base.x, base.z);
        yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
        const lim = yawLimit();
        look.dragYaw = clamp(yaw, -lim, lim);
        look.dragPitch = 0;
      } else if (look.resting) {
        look.dragYaw = 0;
        look.dragPitch = 0;
      }
      needsFrame = true;
      setTour({ step: i, portrait: isPortrait });
    }

    function queueTour() {
      if (readTourSeen() || tourStep >= 0 || tourTimer) return;
      tourTimer = setTimeout(() => {
        tourTimer = null;
        if (entered && !busy && !peekRef.current && !readTourSeen()) showTourStep(0);
      }, reduced ? 0 : 350);
    }

    function endTour(recenter = false) {
      if (tourStep < 0 && !tourTimer && pausedStep < 0) return;
      saveTourSeen();
      if (tourTimer) {
        clearTimeout(tourTimer);
        tourTimer = null;
      }
      if (tourStep >= 0 && recenter && look.resting) {
        look.dragYaw = 0;
        look.dragPitch = 0;
      }
      tourStep = -1;
      pausedStep = -1;
      clearFocus();
      setTour(null);
    }

    // Opening a project or heading back to the start mid-tour (steps two and three invite them)
    // tucks the tour away; coming back out to the room picks it up at the next step.
    let pausedStep = -1;
    function pauseTour() {
      if (tourTimer) {
        clearTimeout(tourTimer);
        tourTimer = null;
      }
      if (tourStep < 0) return;
      pausedStep = tourStep;
      tourStep = -1;
      clearFocus();
      setTour(null);
    }

    function resumeTour() {
      if (pausedStep < 0) {
        queueTour();
        return;
      }
      const next = pausedStep + 1;
      pausedStep = -1;
      if (next < TOUR_STEPS.length) showTourStep(next);
      else endTour();
    }

    tourNextRef.current = () => {
      if (tourStep + 1 < TOUR_STEPS.length) showTourStep(tourStep + 1);
      else endTour(true);
    };
    tourEndRef.current = endTour;
    tourReplayRef.current = () => {
      if (entered && !busy && !peekRef.current) showTourStep(0);
    };

    function enterRoom(after?: (() => void) | null, target?: { pos: THREE.Vector3; look: THREE.Vector3 }) {
      const doneCb = typeof after === "function" ? after : null;
      if (entered) {
        doneCb?.();
        return;
      }
      entered = true;
      setEnteredState(true);
      setCam(closeUp());
      // The tour waits for the camera to land in the wide shot; a jump straight to a project skips it
      // until the visitor comes back out to the room.
      const land = () => {
        hero?.setAttribute("data-gone", "true");
        hero?.removeAttribute("data-riding");
        clearHeroStyle();
        doneCb?.();
        if (!target) resumeTour();
      };
      if (reduced) {
        hero?.setAttribute("data-gone", "true");
        hero?.removeAttribute("data-riding");
        if (target) {
          look.resting = false;
          moveTo(target, 0, doneCb ?? undefined);
        } else {
          toWide(0, null, () => {
            doneCb?.();
            resumeTour();
          });
        }
        return;
      }
      if (hero) {
        hero.setAttribute("data-riding", "true");
        hero.style.transition = "none";
        hero.style.pointerEvents = "none";
      }
      const ride = (_e: number, k: number) => {
        placeHero(screenMapping(), smoothstep(0, 0.35, k), 1 - smoothstep(0.35, 0.8, k));
      };
      if (target) {
        look.resting = false;
        moveTo(target, 1300, land, ride);
      } else {
        toWide(1600, ride, land);
      }
    }

    function backToScreen(after?: () => void) {
      callbacksRef.current.onClosePeekState();
      hideTag();
      if (!entered) {
        if (typeof after === "function") after();
        return;
      }
      syncDeck(currentTrackIdx, false);
      stopInstruments();
      look.resting = false;
      // The tour itself points at the phone/iMac as the way back to the start, so following it
      // tucks the tour away; entering the room again picks it up at the next step.
      pauseTour();
      const finish = () => {
        entered = false;
        setEnteredState(false);
        hero?.removeAttribute("data-gone");
        hero?.removeAttribute("data-riding");
        clearHeroStyle();
        document.getElementById("enterRoomBtn")?.focus({ preventScroll: true });
        if (typeof after === "function") after();
      };
      if (reduced) {
        moveTo(closeUp(), 0, finish);
        return;
      }
      if (hero) {
        hero.setAttribute("data-riding", "true");
        hero.style.transition = "none";
        hero.style.pointerEvents = "none";
        hero.removeAttribute("data-gone");
      }
      placeHero(screenMapping(), 1, 0);
      moveTo(closeUp(), 1400, finish, (_e, k) => {
        placeHero(screenMapping(), 1 - smoothstep(0.65, 1, k), smoothstep(0.2, 0.6, k));
      });
    }

    function openCase(project: HomeProject, swapDir?: 1 | -1) {
      callbacksRef.current.onOpenPeek({ kind: "case", project, swapDir }, "work");
    }
    function openTerminal() {
      callbacksRef.current.onOpenPeek({ kind: "terminal" }, "experience");
    }
    function openAbout() {
      callbacksRef.current.onOpenPeek({ kind: "about" }, "about");
    }
    function openAll() {
      callbacksRef.current.onOpenPeek({ kind: "all" }, "work");
    }

    function canvasDist(entry: { w: number; h: number }) {
      return Math.max(entry.h, entry.w / 1.6) * 1.9;
    }

    function goTo(mesh: THREE.Object3D, dist: number, open: () => void) {
      callbacksRef.current.onClosePeekState();
      hideTag();
      pauseTour();
      if (entered) zoomTo(mesh, dist, open);
      else enterRoom(open, zoomTarget(mesh, dist));
    }

    function goToProject(index: number, dir?: 1 | -1) {
      const n = roomProjects.length;
      const i = ((index % n) + n) % n;
      const p = roomProjects[i].project;
      const c = canvasMeshes[p.slug];
      if (peekRef.current?.kind === "case") {
        openCase(p, dir ?? 1);
        zoomTo(c.face, canvasDist(c));
        return;
      }
      goTo(c.face, canvasDist(c), () => openCase(p));
    }

    function goToAll() {
      goTo(refs.printsAnchor, 1.25, openAll);
    }

    function closePeekToWide() {
      callbacksRef.current.onClosePeekState();
      if (entered) toWide(750, null, resumeTour);
    }

    function roomNav(key: RoomNavKey): boolean {
      if (key === "work") {
        callbacksRef.current.onClosePeekState();
        goToProject(0);
        return true;
      }
      if (key === "experience") {
        hideTag();
        backToScreen(openTerminal);
        return true;
      }
      if (key === "about") {
        goTo(refs.neonSign, 1.9, openAbout);
        return true;
      }
      return false;
    }

    registerActions({
      enterRoom: () => enterRoom(),
      backToScreen,
      openTerminal,
      goToProject,
      goToAll,
      closePeekToWide,
      nav: roomNav,
    });

    /* Interactive object registry */
    let playing = false;
    let posterStraight = false;
    let swingStart = -1;
    let spinning = false;
    let platterSpeed = 0;
    let armAngle = 0.05;
    let currentTrackIdx = 0;
    let loadedTrackIdx = -1;
    let audioRampRaf = 0;
    let activeDeckToken = 0;
    let cleanupPlayingListener: (() => void) | null = null;

    const audio = new Audio();
    audio.preload = "none";
    audio.volume = RECORD_TRACKS[0].volume;

    const synthAudio = new Audio();
    synthAudio.preload = "none";
    synthAudio.loop = false;
    synthAudio.volume = 0.18;

    const onSynthEnded = () => {
      playing = false;
      synthAudio.currentTime = 0;
      renderOnce();
    };
    synthAudio.addEventListener("ended", onSynthEnded);

    const GUITAR_HITS = ["/audio/guitar-hit-1.m4a", "/audio/guitar-hit-2.m4a"] as const;
    const guitarAudio = new Audio();
    guitarAudio.preload = "none";
    guitarAudio.volume = 0.22;
    let guitarHitIdx = 0;

    function stopInstruments() {
      playing = false;
      synthAudio.pause();
      synthAudio.currentTime = 0;
      guitarAudio.pause();
      guitarAudio.currentTime = 0;
      renderOnce();
    }
    stopInstrumentsRef.current = stopInstruments;

    function setPreservePitch(preserve: boolean) {
      const media = audio as HTMLAudioElement & {
        webkitPreservesPitch?: boolean;
        mozPreservesPitch?: boolean;
      };
      media.preservesPitch = preserve;
      media.webkitPreservesPitch = preserve;
      media.mozPreservesPitch = preserve;
    }

    function cancelAudioRamp() {
      if (audioRampRaf) {
        cancelAnimationFrame(audioRampRaf);
        audioRampRaf = 0;
      }
      cleanupPlayingListener?.();
      cleanupPlayingListener = null;
    }

    function rampAudio(opts: {
      fromRate: number;
      toRate: number;
      fromVol: number;
      toVol: number;
      durationMs: number;
      pauseOnDone: boolean;
      token: number;
    }) {
      const start = performance.now();
      audio.playbackRate = opts.fromRate;
      audio.volume = clamp(opts.fromVol, 0, 1);

      const step = (now: number) => {
        if (opts.token !== activeDeckToken) return;
        const t = Math.min(1, (now - start) / opts.durationMs);
        const eased = opts.pauseOnDone ? t * t : 1 - Math.pow(1 - t, 3);
        audio.playbackRate = opts.fromRate + (opts.toRate - opts.fromRate) * eased;
        // Fade volume smoothly in during start, and gently out near the end of wind-down.
        const volT = opts.pauseOnDone ? Math.max(0, (t - 0.15) / 0.85) : Math.min(1, t / 0.72);
        audio.volume = clamp(opts.fromVol + (opts.toVol - opts.fromVol) * volT, 0, 1);

        if (t < 1) {
          audioRampRaf = requestAnimationFrame(step);
          return;
        }
        audioRampRaf = 0;
        if (opts.pauseOnDone) {
          audio.pause();
          audio.playbackRate = 1;
          setPreservePitch(true);
        }
      };
      audioRampRaf = requestAnimationFrame(step);
    }

    function syncDeck(nextTrack: number, shouldPlay: boolean) {
      const idx = ((nextTrack % RECORD_TRACKS.length) + RECORD_TRACKS.length) % RECORD_TRACKS.length;
      const wasPlaying = spinning;
      const trackChanged = loadedTrackIdx !== idx;
      const token = ++activeDeckToken;

      cancelAudioRamp();
      currentTrackIdx = idx;
      refs.setRecordTrack(idx);
      spinning = shouldPlay;
      setTrackIndex(idx);
      setDeckPlaying(shouldPlay);

      const targetVol = RECORD_TRACKS[idx].volume;

      if (shouldPlay) {
        if (trackChanged) {
          if (!audio.paused) audio.pause();
          loadedTrackIdx = idx;
          audio.src = RECORD_TRACKS[idx].src;
          audio.currentTime = 0;
          playDiscSwap();
        } else if (!wasPlaying) {
          playNeedleDrop();
        }

        startVinylTexture();
        setPreservePitch(false);

        if (!trackChanged && !audio.paused) {
          // Catch platter mid-wind-down (or keep running) without restarting playback.
          rampAudio({
            fromRate: audio.playbackRate || 0.7,
            toRate: 1,
            fromVol: audio.volume,
            toVol: targetVol,
            durationMs: 220,
            pauseOnDone: false,
            token,
          });
        } else {
          const startRate = trackChanged ? 0.65 : 0.62;
          audio.playbackRate = startRate;
          audio.volume = 0.015;

          const startWindUp = () => {
            cleanupPlayingListener = null;
            if (token !== activeDeckToken) return;
            rampAudio({
              fromRate: startRate,
              toRate: 1,
              fromVol: 0.015,
              toVol: targetVol,
              durationMs: 250,
              pauseOnDone: false,
              token,
            });
          };

          const onPlaying = () => startWindUp();
          audio.addEventListener("playing", onPlaying, { once: true });
          cleanupPlayingListener = () => audio.removeEventListener("playing", onPlaying);

          void audio.play().catch(() => {
            if (token !== activeDeckToken) return;
            cancelAudioRamp();
            spinning = false;
            setDeckPlaying(false);
            stopVinylTexture();
          });
        }
      } else {
        if (wasPlaying && !audio.paused) {
          playNeedleLift();
          stopVinylTexture(0.22);
          setPreservePitch(false);
          rampAudio({
            fromRate: audio.playbackRate || 1,
            toRate: 0.48,
            fromVol: audio.volume,
            toVol: 0,
            durationMs: 340,
            pauseOnDone: true,
            token,
          });
        } else {
          audio.pause();
          audio.playbackRate = 1;
          stopVinylTexture();
        }
      }
      renderOnce();
    }
    syncDeckRef.current = syncDeck;

    const onAudioEnded = () => {
      syncDeck(currentTrackIdx + 1, true);
    };
    audio.addEventListener("ended", onAudioEnded);

    const objects: InteractiveObj[] = [
      { key: "imac", label: "desktop · back to the screen", hit: [screen], anchor: () => screen, act: () => { playClick(); backToScreen(); } },
      {
        key: "phone",
        // On phones the desk phone is the hero screen; on wide screens it is only a prop.
        get label() {
          return isPortrait ? "phone · back to the screen" : "phone · on do not disturb";
        },
        hit: [phoneScreen],
        anchor: () => phoneScreen,
        act: () => {
          if (!isPortrait) return;
          playClick();
          backToScreen();
        },
      },
      { key: "window", label: "window · night mode", hit: [refs.windowHit], anchor: () => refs.windowHit, act: () => { playSwitch(); toggleTheme(); } },
      {
        key: "neon",
        label: "neon · flick it",
        hit: [refs.neonSign],
        anchor: () => refs.neonSign,
        act: () => {
          playSwitch();
          flickerUntil = performance.now() + 950;
        },
      },
      {
        key: "rack",
        label: "synth rack · ▶ jam",
        hit: [refs.rackHit],
        anchor: () => refs.rackHit,
        act: () => {
          playSwitch();
          playing = !playing;
          if (playing) {
            if (!synthAudio.getAttribute("src")) {
              synthAudio.src = "/audio/synth-jam.m4a";
            }
            synthAudio.currentTime = 0;
            void synthAudio.play().catch(() => {
              playing = false;
            });
          } else {
            synthAudio.pause();
            synthAudio.currentTime = 0;
          }
          renderOnce();
        },
      },
      {
        key: "guitar",
        label: "guitar · strum it",
        hit: [refs.guitarHit],
        anchor: () => refs.guitarHit,
        act: () => {
          swingStart = performance.now();
          guitarAudio.src = GUITAR_HITS[guitarHitIdx];
          guitarHitIdx = (guitarHitIdx + 1) % GUITAR_HITS.length;
          guitarAudio.currentTime = 0;
          void guitarAudio.play().catch(() => {});
        },
      },
      {
        key: "poster",
        label: "favorite album · straighten it",
        hit: [refs.pst],
        anchor: () => refs.pst,
        act: () => {
          playClick();
          posterStraight = !posterStraight;
        },
      },
      {
        key: "prints",
        direct: true,
        label: "all projects →",
        hit: [refs.printsHit],
        anchor: () => refs.printsHit,
        act: () => { playClick(); goToAll(); },
      },
      {
        key: "turntable",
        label: "record player · play / pause",
        hit: [refs.deckHit],
        anchor: () => refs.deckHit,
        act: () => {
          syncDeck(currentTrackIdx, !spinning);
        },
      },
      {
        key: "crate",
        label: "vinyl crate · next track",
        hit: [refs.crateHit],
        anchor: () => refs.crateHit,
        act: () => {
          syncDeck(currentTrackIdx + 1, true);
        },
      },
    ];

    roomProjects.forEach(({ project }, idx) => {
      const c = canvasMeshes[project.slug];
      objects.push({
        key: project.slug,
        direct: true,
        label: `${project.title.split(":")[0].toLowerCase()} →`,
        hit: [c.face],
        anchor: () => c.face,
        act: () => { playClick(); goToProject(idx); },
      });
    });

    const hitList: THREE.Object3D[] = [];
    objects.forEach((o) => {
      o.hit.forEach((m) => {
        m.userData.obj = o;
        hitList.push(m);
      });
    });
    // The desk phone stays out of the keyboard list: the iMac entry already returns to the hero on
    // phones, and on wide screens the phone is only a prop.
    setKeyObjects(objects.filter((o) => o.key !== "phone"));

    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const tmpV = new THREE.Vector3();
    let hovered: InteractiveObj | null = null;

    function projectObj(obj: THREE.Object3D) {
      obj.getWorldPosition(tmpV);
      tmpV.project(camera);
      const r = canvas!.getBoundingClientRect();
      return { x: ((tmpV.x + 1) / 2) * r.width, y: ((1 - tmpV.y) / 2) * r.height };
    }

    function showTag(o: InteractiveObj, x?: number, y?: number) {
      const tagEl = tagRef.current;
      if (!tagEl) return;
      tagEl.textContent = resolveObjLabel(o, isDarkRef.current);
      tagEl.hidden = false;
      const pos = x === undefined || y === undefined ? projectObj(o.anchor()) : { x, y };
      tagEl.style.left = `${pos.x}px`;
      tagEl.style.top = `${pos.y}px`;
    }

    function hideTag() {
      const tagEl = tagRef.current;
      if (tagEl) tagEl.hidden = true;
    }

    showTagForObjRef.current = (o) => {
      if (entered) showTag(o);
    };
    backToScreenRef.current = () => backToScreen();
    hideTagRef.current = hideTag;
    runKeyObjectRef.current = (o) => {
      if (o.direct) o.act();
      else enterRoom(o.act);
    };

    function raycastAt(clientX: number, clientY: number): InteractiveObj | null {
      const r = canvas!.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(hitList, false)[0];
      return hit ? ((hit.object.userData.obj as InteractiveObj | undefined) ?? null) : null;
    }

    // Phones turn the head (see the render loop): 0.58 rad frames the couch, W and coat rack at the ends.
    function yawLimit() {
      return isPortrait ? 0.58 : 0.4;
    }

    function nudge(dx: number, dy: number) {
      const lim = yawLimit();
      // Zoomed in, the same drag turns less, so the view tracks the finger.
      const k = 1 / zoom.cur;
      look.dragYaw = clamp(look.dragYaw - dx * 0.0022 * k, -lim, lim);
      look.dragPitch = clamp(look.dragPitch - dy * 0.0016 * k, -0.12, 0.14);
      hideTag();
    }

    /* Input listeners: mouse hover, scarlet dot cursor, trackpad 2-finger wheel, 1-finger & 2-finger touch pan */
    function onWheel(e: WheelEvent) {
      if (!entered || busy || peekRef.current) return;
      e.preventDefault();
      // Trackpad pinch arrives as a ctrl+wheel event.
      if (e.ctrlKey) {
        zoomBy(Math.exp(-e.deltaY * 0.01));
        return;
      }
      const k = e.deltaMode === 1 ? 16 : 1;
      nudge(-e.deltaX * k, e.deltaY * k);
    }

    let touchOrigin: { x: number; y: number } | null = null;
    let touchLast: { x: number; y: number } | null = null;
    let touchCount = 0;
    let dragged = false;
    let pinchDist = 0;

    function touchSpread(touches: TouchList) {
      return touches.length >= 2
        ? Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
        : 0;
    }

    function touchMid(touches: TouchList) {
      if (touches.length >= 2) {
        return {
          x: (touches[0].clientX + touches[1].clientX) / 2,
          y: (touches[0].clientY + touches[1].clientY) / 2,
        };
      }
      return { x: touches[0].clientX, y: touches[0].clientY };
    }

    function onTouchStart(e: TouchEvent) {
      if (!entered || busy || peekRef.current) return;
      if (e.touches.length === 1 || e.touches.length === 2) {
        const m = touchMid(e.touches);
        touchOrigin = m;
        touchLast = m;
        touchCount = e.touches.length;
        pinchDist = touchSpread(e.touches);
        dragged = false;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (!entered || busy || peekRef.current || !touchLast) return;
      if (e.touches.length !== touchCount) {
        touchLast = touchMid(e.touches);
        touchCount = e.touches.length;
        pinchDist = touchSpread(e.touches);
        return;
      }
      const m = touchMid(e.touches);
      const dx = m.x - touchLast.x;
      const dy = m.y - touchLast.y;
      if (touchOrigin && Math.hypot(m.x - touchOrigin.x, m.y - touchOrigin.y) > 6) {
        dragged = true;
      }
      if (touchCount === 2) {
        // Two fingers both pan (midpoint) and pinch (spread).
        const spread = touchSpread(e.touches);
        if (pinchDist > 0 && spread > 0) zoomBy(spread / pinchDist);
        pinchDist = spread;
      }
      if (dragged || touchCount === 2) {
        e.preventDefault();
        // nudge() takes wheel-style deltas, and a finger's vertical motion is the reverse of a
        // trackpad's deltaY, so flip dy: dragging up or down now matches the trackpad.
        nudge(dx, -dy);
      }
      touchLast = m;
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length === 0) {
        touchOrigin = null;
        touchLast = null;
        touchCount = 0;
      } else {
        touchLast = touchMid(e.touches);
        touchCount = e.touches.length;
        pinchDist = touchSpread(e.touches);
      }
    }

    function onPointerMove(e: PointerEvent) {
      const dot = dotRef.current;
      if (dot && e.pointerType === "mouse") {
        const onRoom = e.target === canvas && !peekRef.current;
        dot.classList.toggle("is-on", onRoom);
        if (onRoom) {
          dot.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
        }
      }
      if (!entered || busy || peekRef.current || e.pointerType === "touch") return;
      const hitObj = raycastAt(e.clientX, e.clientY);
      hovered = hitObj;
      canvas!.style.cursor = hovered ? "pointer" : "default";
      dot?.classList.toggle("is-hot", Boolean(hovered));
      const r = canvas!.getBoundingClientRect();
      if (hovered) showTag(hovered, e.clientX - r.left, e.clientY - r.top);
      else hideTag();
    }

    function onPointerLeave() {
      hovered = null;
      dotRef.current?.classList.remove("is-on", "is-hot");
      hideTag();
    }

    function onWindowBlur() {
      dotRef.current?.classList.remove("is-on", "is-hot");
    }

    function onCanvasClick(e: MouseEvent) {
      if (dragged) {
        dragged = false;
        return;
      }
      if (!entered || busy || peekRef.current) return;
      const targetObj = hovered ?? raycastAt(e.clientX, e.clientY);
      if (targetObj) {
        hideTag();
        targetObj.act();
      }
    }

    /* Hero wheel & swipe to enter */
    function onHeroWheel(e: WheelEvent) {
      if (!entered && e.deltaY > 0 && heroScreenEl!.scrollTop === 0) {
        e.preventDefault();
        enterRoom();
      }
    }
    let heroTouchY: number | null = null;
    function onHeroTouchStart(e: TouchEvent) {
      heroTouchY = e.touches[0].clientY;
    }
    function onHeroTouchMove(e: TouchEvent) {
      if (!entered && heroTouchY !== null && heroTouchY - e.touches[0].clientY > 40) {
        heroTouchY = null;
        enterRoom();
      }
    }

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("click", onCanvasClick);
    window.addEventListener("blur", onWindowBlur);
    hero.addEventListener("wheel", onHeroWheel, { passive: false });
    hero.addEventListener("touchstart", onHeroTouchStart, { passive: true });
    hero.addEventListener("touchmove", onHeroTouchMove, { passive: true });

    /* Resize & IntersectionObserver */
    function resize() {
      if (!stage || !canvas) return;
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const aspect = r.width / r.height;
      renderer.setSize(r.width, r.height, false);
      sizeFocusMask();
      camera.aspect = aspect;
      baseFov = aspect < 1 ? 62 : aspect < 1.4 ? 54 : 50;
      applyFov();
      WIDE.pos.z = aspect < 1 ? 4.6 : aspect < 1.4 ? 4.9 : 4.1;
      if (entered && look.resting && !tween) {
        look.yaw += 1e-3;
      }
      layoutHero();
      // Rotating a phone to landscape swaps the head turn for the orbit, which allows less yaw.
      const lim = yawLimit();
      look.dragYaw = clamp(look.dragYaw, -lim, lim);
      look.yaw = clamp(look.yaw, -lim, lim);
      redrawHero();
      if (!entered) setCam(closeUp());
      renderOnce();
    }

    let stageOnScreen = true;
    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            stageOnScreen = entries[0]?.isIntersecting ?? true;
          })
        : null;
    io?.observe(stage);

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(stage);
    window.addEventListener("resize", resize);

    /* Render loop */
    let rafId = 0;
    let lastT = 0;
    let lastDraw = 0;
    let benchFrames = 0;
    let benchWindowStart = performance.now();
    let benchFrameMsSum = 0;

    function frame(now: number) {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - (lastT || now)) / 1000);
      lastT = now;

      let animating = false;
      let ambient = false;
      const viewIsRoom = document.documentElement.dataset.view !== "plain" && document.documentElement.dataset.view !== "about";
      const visibleRoom = entered && !peekRef.current && stageOnScreen && viewIsRoom;

      const targetPlatterSpeed = spinning ? 3.49 : 0;
      if (visibleRoom && !reduced) {
        if (Math.abs(platterSpeed - targetPlatterSpeed) > 0.01) {
          const rate = spinning ? 7.5 : 4.2;
          platterSpeed += (targetPlatterSpeed - platterSpeed) * Math.min(1, dt * rate);
          animating = true;
        } else {
          platterSpeed = targetPlatterSpeed;
        }
        if (platterSpeed > 0.01) {
          refs.record.rotation.y -= dt * platterSpeed;
          if (spinning) ambient = true;
        }
      }
      if (visibleRoom && !reduced) {
        refs.rotor.rotation.y += dt * 0.85;
        ambient = true;
      }
      const armTo = spinning ? -0.5 : 0.05;
      if (Math.abs(armAngle - armTo) > 0.002) {
        armAngle += (armTo - armAngle) * (reduced ? 1 : 0.1);
        refs.arm.rotation.y = armAngle;
        animating = true;
      }

      if (tween) {
        const k = Math.min(1, (now - tween.t0) / tween.ms);
        const e = easeInOutCubic(k);
        cam.pos.lerpVectors(tween.from.pos, tween.to.pos, e);
        cam.look.lerpVectors(tween.from.look, tween.to.look, e);
        camera.position.copy(cam.pos);
        camera.lookAt(cam.look);
        animating = true;
        tween.step?.(e, k);
        if (k >= 1) {
          const d = tween.done;
          tween = null;
          d();
        }
      }

      if (now < flickerUntil) {
        const on = isDarkRef.current ? (Math.sin(now / 23) > -0.2 ? 1 : 0.15) : Math.sin(now / 23) > 0 ? 0.6 : 0;
        refs.neonMat.emissive.copy(linearColor(0xff5a3c));
        refs.neonMat.emissiveIntensity = 1.8 * on;
        refs.neonLight.intensity = 1.6 * on;
        animating = true;
      } else if (flickerUntil) {
        flickerUntil = 0;
        applyTheme(isDarkRef.current);
      }

      if (swingStart >= 0) {
        shadowDirty = true;
        const t = (now - swingStart) / 1000;
        refs.guitar.rotation.z = reduced ? 0 : 0.09 * Math.exp(-2.2 * t) * Math.sin(t * 9);
        animating = true;
        if (t > 2.4) {
          swingStart = -1;
          refs.guitar.rotation.z = 0;
        }
      }

      const posterTarget = posterStraight ? 0 : 0.06;
      if (Math.abs(refs.poster.rotation.z - posterTarget) > 0.0005) {
        shadowDirty = true;
        refs.poster.rotation.z += (posterTarget - refs.poster.rotation.z) * (reduced ? 1 : 0.12);
        animating = true;
      }

      if (playing) {
        refs.keysMat.emissive.copy(linearColor(0xff3b1f));
        refs.keysMat.emissiveIntensity = reduced ? 0.25 : 0.15 + 0.15 * Math.sin(now / 140);
        if (!reduced) animating = true;
      } else if (refs.keysMat.emissiveIntensity) {
        refs.keysMat.emissiveIntensity = 0;
        refs.keysMat.emissive.setHex(0x000000);
        needsFrame = true;
      }

      if (!entered || !look.resting) zoom.want = 1;
      if (zoom.cur !== zoom.want) {
        zoom.cur += (zoom.want - zoom.cur) * (reduced ? 1 : 0.18);
        if (Math.abs(zoom.want - zoom.cur) < 1e-3) zoom.cur = zoom.want;
        applyFov();
        animating = true;
      }

      if (entered && look.resting && !tween) {
        const dyw = look.dragYaw - look.yaw;
        const dpt = look.dragPitch - look.pitch;
        if (Math.abs(dyw) + Math.abs(dpt) > 1e-4 || needsFrame) {
          look.yaw += dyw * 0.08;
          look.pitch += dpt * 0.08;
          const off = new THREE.Vector3().subVectors(WIDE.pos, WIDE.look).applyAxisAngle(Y_AXIS, look.yaw);
          const side = new THREE.Vector3().crossVectors(Y_AXIS, off).normalize();
          off.applyAxisAngle(side, -look.pitch);
          if (isPortrait) {
            // Phones turn the head instead of orbiting the back wall, so the side walls
            // (couch, W, coat rack) can come into view in the narrow frame.
            cam.pos.copy(WIDE.pos);
            cam.look.copy(WIDE.pos).sub(off);
          } else {
            cam.pos.copy(WIDE.look).add(off);
            cam.look.copy(WIDE.look);
          }
          camera.position.copy(cam.pos);
          camera.lookAt(cam.look);
          animating = true;
        }
      }

      const dark = isDarkRef.current;
      const tourLit = tourStep >= 0 && Boolean(TOUR_STEPS[tourStep].canvases);
      roomProjects.forEach(({ project }) => {
        const c = canvasMeshes[project.slug];
        const matHalo = c.halo.material as THREE.MeshBasicMaterial;
        const lit = tourLit || (hovered && hovered.key === project.slug);
        const want = (dark ? 0.85 : 0) + (lit ? (dark ? 0.35 : 0.55) : 0);
        if (Math.abs(matHalo.opacity - want) > 0.01) {
          matHalo.opacity += (want - matHalo.opacity) * (reduced ? 1 : 0.15);
          animating = true;
        }
      });

      if (focus.cur !== focus.want) {
        focus.cur += (focus.want - focus.cur) * (reduced ? 1 : 0.14);
        if (Math.abs(focus.want - focus.cur) < 0.004) focus.cur = focus.want;
        if (focus.cur === 0) setFocusTargets([]);
        animating = true;
      }

      if (animating || needsFrame || (ambient && now - lastDraw > 32)) {
        const tRender0 = benchMode ? performance.now() : 0;
        if (shadowDirty) {
          renderer.shadowMap.needsUpdate = true;
          shadowDirty = false;
          shadowRedraws++;
        }
        renderer.render(scene, camera);
        needsFrame = false;
        lastDraw = now;
        drawFocus();

        if (benchMode) {
          benchFrames++;
          benchFrameMsSum += performance.now() - tRender0;
          if (now - benchWindowStart >= 1000) {
            const fps = Math.round((benchFrames * 1000) / (now - benchWindowStart));
            const avgMs = (benchFrameMsSum / benchFrames).toFixed(1);
            setBenchText(`${fps} fps · ${avgMs}ms · dpr ${dpr} · sh ${shadowRedraws}`);
            benchFrames = 0;
            benchFrameMsSum = 0;
            benchWindowStart = now;
          }
        }
      }

    }

    resize();
    if (shadowDirty) {
      renderer.shadowMap.needsUpdate = true;
      shadowDirty = false;
      shadowRedraws++;
    }
    renderer.render(scene, camera);
    needsFrame = false;
    sceneBuilt = true;
    callbacksRef.current.onProgress?.(0.68);
    safetyTimer = setTimeout(() => {
      texturesDone = true;
      fontsDone = true;
      tryFinishLoad();
    }, 1500);
    tryFinishLoad();
    rafId = requestAnimationFrame(frame);

    return () => {
      readyEmitted = true;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (fontTimer) clearTimeout(fontTimer);
      cancelAnimationFrame(rafId);
      if (tourTimer) clearTimeout(tourTimer);
      clearFocus();
      if (clockTimer) clearTimeout(clockTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      registerActions(null);
      io?.disconnect();
      ro?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", onWindowBlur);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onCanvasClick);
      hero.removeEventListener("wheel", onHeroWheel);
      hero.removeEventListener("touchstart", onHeroTouchStart);
      hero.removeEventListener("touchmove", onHeroTouchMove);
      audio.removeEventListener("ended", onAudioEnded);
      activeDeckToken++;
      cancelAudioRamp();
      audio.pause();
      stopVinylTexture();
      audio.removeAttribute("src");
      audio.load();
      syncDeckRef.current = null;
      stopInstruments();
      synthAudio.removeEventListener("ended", onSynthEnded);
      synthAudio.removeAttribute("src");
      synthAudio.load();
      guitarAudio.removeAttribute("src");
      guitarAudio.load();
      stopInstrumentsRef.current = null;
      if (heroTex) heroTex.dispose();
      hero.removeAttribute("data-gone");
      clearHeroStyle();
      disposeRoomScene(scene);
      setFocusTargets([]);
      maskRT.dispose();
      maskBlack.dispose();
      maskWhite.dispose();
      dimMat.dispose();
      dimQuad.geometry.dispose();
      renderer.dispose();
    };
  }, [projects, stageRef, heroRef, heroScreenRef, registerActions]);

  // Apply theme changes to the 3D scene without rebuilding it.
  useEffect(() => {
    applyThemeRef.current?.(theme === "dark");
  }, [theme]);

  // Pause turntable and instrument audio if the user switches away from the 3D room view.
  useEffect(() => {
    if (view !== "room") {
      if (deckPlaying) {
        syncDeckRef.current?.(trackIndex, false);
      }
      stopInstrumentsRef.current?.();
    }
  }, [view, trackIndex, deckPlaying]);

  const currentTrack = RECORD_TRACKS[trackIndex] ?? RECORD_TRACKS[0];

  return (
    <>
      <canvas
        ref={canvasRef}
        id="scene"
        className={enteredState ? "ln-stage__canvas is-entered" : "ln-stage__canvas"}
        aria-hidden="true"
      />

      <div className="ln-stage__bar" hidden={!enteredState}>
        <button
          type="button"
          className="ln-btn ln-btn--sm"
          onClick={() => backToScreenRef.current?.()}
          id="roomBackBtn"
        >
          ↺ back to the screen
        </button>
        {!tour && (
          <button type="button" className="ln-btn ln-btn--sm" onClick={() => tourReplayRef.current?.()}>
            Tour
          </button>
        )}
        <div className="ln-deck" role="group" aria-label="Record player">
          <span
            className={deckPlaying ? "ln-deck__dot is-spinning" : "ln-deck__dot"}
            style={{ background: currentTrack.labelColor }}
            aria-hidden="true"
          />
          <span className="ln-deck__title">{currentTrack.title}</span>
          <button
            type="button"
            className="ln-deck__btn"
            aria-label="Previous track"
            onClick={() => syncDeckRef.current?.(trackIndex - 1, true)}
          >
            ‹
          </button>
          <button
            type="button"
            className="ln-deck__btn"
            aria-label={deckPlaying ? "Pause record player" : "Play record player"}
            onClick={() => syncDeckRef.current?.(trackIndex, !deckPlaying)}
          >
            {deckPlaying ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            className="ln-deck__btn"
            aria-label="Next track"
            onClick={() => syncDeckRef.current?.(trackIndex + 1, true)}
          >
            ›
          </button>
        </div>
        {benchText && <span className="ln-bench">{benchText}</span>}
      </div>

      <div ref={tagRef} className="ln-tag" hidden />

      {tour && (
        <div className="ln-tour" role="region" aria-label="Room tour">
          <TypedLine
            key={tour.step}
            text={TOUR_STEPS[tour.step].text(tour.portrait)}
            link={TOUR_STEPS[tour.step].plainLink}
            onLink={() => {
              tourEndRef.current?.();
              callbacksRef.current.onSwitchToPlain();
            }}
          />
          <div className="ln-tour__actions">
            <span className="ln-tour__count">
              {tour.step + 1} / {TOUR_STEPS.length}
            </span>
            {tour.step + 1 < TOUR_STEPS.length && (
              <button type="button" className="ln-btn ln-btn--sm ln-btn--text" onClick={() => tourEndRef.current?.(true)}>
                Skip
              </button>
            )}
            <button type="button" className="ln-btn ln-btn--sm ln-btn--ink" onClick={() => tourNextRef.current?.()}>
              {tour.step + 1 < TOUR_STEPS.length ? "Next" : "Done"}
            </button>
          </div>
        </div>
      )}

      <div className="ln-keys" role="group" aria-label="Things in the room">
        {keyObjects.map((o) => (
          <button
            key={o.key}
            type="button"
            onFocus={() => showTagForObjRef.current?.(o)}
            onBlur={() => hideTagRef.current?.()}
            onClick={() => runKeyObjectRef.current?.(o)}
          >
            {resolveObjLabel(o, theme === "dark")}
          </button>
        ))}
      </div>

      {isFinePointer && <div ref={dotRef} className="ln-cursordot" aria-hidden="true" />}
    </>
  );
}
