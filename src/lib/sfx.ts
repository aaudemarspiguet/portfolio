"use client";

import { useSyncExternalStore } from "react";

/**
 * Tactile Web Audio SFX powered by MIT/CC0 switch & mouse samples from Thock
 * (`Razer Orochi V2` CC0 + `Gateron Ink Black` MIT), plus subtle -35 dB vinyl
 * texture when spinning records on the turntable.
 */

const SFX_STORAGE_KEY = "sfx";
const SAMPLE_URLS = {
  clickDown: "/sfx/click-down.wav",
  keyEnter: "/sfx/key-enter.wav",
} as const;

type SampleName = keyof typeof SAMPLE_URLS;

let ctx: AudioContext | null = null;
const buffers = new Map<SampleName, AudioBuffer>();
let loadingPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

let vinylBuffer: AudioBuffer | null = null;
let vinylSource: AudioBufferSourceNode | null = null;
let vinylGain: GainNode | null = null;

function notify() {
  listeners.forEach((fn) => fn());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === SFX_STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function isSfxEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SFX_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSfxEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SFX_STORAGE_KEY, enabled ? "on" : "off");
  } catch {}
  notify();
}

export function toggleSfx(): boolean {
  const next = !isSfxEnabled();
  setSfxEnabled(next);
  if (next) playSwitch();
  return next;
}

export function useSfxEnabled(): boolean {
  return useSyncExternalStore(subscribe, isSfxEnabled, () => true);
}

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

async function preloadAll(ac: AudioContext) {
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    await Promise.all(
      (Object.entries(SAMPLE_URLS) as [SampleName, string][]).map(async ([name, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const arr = await res.arrayBuffer();
          const decoded = await ac.decodeAudioData(arr);
          buffers.set(name, decoded);
        } catch {}
      }),
    );
  })();
  return loadingPromise;
}

export function unlockSfx() {
  if (!isSfxEnabled()) return;
  const ac = ensureContext();
  if (!ac) return;
  if (ac.state === "suspended") {
    void ac.resume().catch(() => {});
  }
  void preloadAll(ac);
}

function playBuffer(name: SampleName, gainValue: number, rateJitter = 0.035) {
  if (!isSfxEnabled()) return;
  const ac = ensureContext();
  if (!ac) return;
  if (ac.state === "suspended") {
    void ac.resume().catch(() => {});
  }
  void preloadAll(ac);
  const buf = buffers.get(name);
  if (!buf) return;

  const src = ac.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = 1 + (Math.random() * 2 - 1) * rateJitter;

  const gain = ac.createGain();
  gain.gain.value = gainValue;

  src.connect(gain);
  gain.connect(ac.destination);
  src.start();
}

/** Crisp Thock Razer Orochi mouse click for buttons & UI taps. */
export function playClick() {
  playBuffer("clickDown", 0.24, 0.035);
}

/** Tactile Gateron Ink Black enter-switch thock for toggles & 3D room switches. */
export function playSwitch() {
  playBuffer("keyEnter", 0.32, 0.03);
}

/** Builds a seamless 4s stereo vinyl surface noise + faint wax micro-crackle buffer (~ -36 dB). */
function getVinylBuffer(ac: AudioContext): AudioBuffer {
  if (vinylBuffer && vinylBuffer.sampleRate === ac.sampleRate) return vinylBuffer;

  const secs = 4;
  const len = Math.floor(ac.sampleRate * secs);
  const buf = ac.createBuffer(2, len, ac.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    // Warm pink-tinted analog surface air (~ -38 dB RMS).
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.025;
      b1 = 0.985 * b1 + white * 0.035;
      b2 = 0.95 * b2 + white * 0.045;
      data[i] = (b0 + b1 + b2) * 0.012;
    }

    // Sparse, delicate stylus dust ticks (~ 10 subtle grains over 4s, ~ -34 dB peak).
    const tickCount = 10;
    for (let t = 0; t < tickCount; t++) {
      const pos = Math.floor(Math.random() * (len - 48));
      const amp = (0.008 + Math.random() * 0.014) * (Math.random() > 0.5 ? 1 : -1);
      const decayLen = 10 + Math.floor(Math.random() * 22);
      for (let k = 0; k < decayLen && pos + k < len; k++) {
        data[pos + k] += amp * Math.exp(-k / (3 + Math.random() * 3));
      }
    }
  }

  vinylBuffer = buf;
  return buf;
}

const VINYL_SURFACE_LEVEL = 0.31;

/** Starts subtle vinyl surface texture under the spinning record. */
export function startVinylTexture() {
  const ac = ensureContext();
  if (!ac) return;
  if (ac.state === "suspended") {
    void ac.resume().catch(() => {});
  }

  if (vinylSource && vinylGain) {
    const now = ac.currentTime;
    vinylGain.gain.cancelScheduledValues(now);
    vinylGain.gain.setValueAtTime(vinylGain.gain.value, now);
    vinylGain.gain.linearRampToValueAtTime(VINYL_SURFACE_LEVEL, now + 0.25);
    return;
  }

  const src = ac.createBufferSource();
  src.buffer = getVinylBuffer(ac);
  src.loop = true;

  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 220;

  const lp = ac.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2400;

  const gain = ac.createGain();
  const now = ac.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(VINYL_SURFACE_LEVEL, now + 0.25);

  src.connect(hp);
  hp.connect(lp);
  lp.connect(gain);
  gain.connect(ac.destination);
  src.start(now);

  vinylSource = src;
  vinylGain = gain;
}

/** Fades out and stops the vinyl surface texture cleanly. */
export function stopVinylTexture(fadeSec = 0.14) {
  const ac = ctx;
  const src = vinylSource;
  const gain = vinylGain;
  vinylSource = null;
  vinylGain = null;
  if (!ac || !src || !gain) return;

  const now = ac.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
  try {
    src.stop(now + fadeSec + 0.02);
  } catch {}
}

type VinylSwipeOpts = {
  delaySec?: number;
  durationSec: number;
  freqStart: number;
  freqEnd: number;
  q: number;
  gainPeak: number;
  ticks: number;
  thud?: { freqStart: number; freqEnd: number; durationSec: number; gain: number };
};

/** Synthesizes a subtle organic stylus-on-vinyl swipe + micro-ticks (no harsh tones). */
function triggerVinylSwipe(opts: VinylSwipeOpts) {
  const ac = ensureContext();
  if (!ac) return;
  if (ac.state === "suspended") {
    void ac.resume().catch(() => {});
  }

  const t0 = ac.currentTime + (opts.delaySec ?? 0);
  const len = Math.max(128, Math.floor(ac.sampleRate * opts.durationSec));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);

  let pink = 0;
  for (let i = 0; i < len; i++) {
    const progress = i / len;
    const env = Math.sin(Math.PI * Math.pow(progress, 0.55));
    const white = Math.random() * 2 - 1;
    pink = 0.88 * pink + white * 0.22;
    data[i] = pink * env;
  }

  // Embed delicate analog stylus-groove ticks inside the brush envelope.
  for (let k = 0; k < opts.ticks; k++) {
    const pos = Math.floor((0.15 + 0.65 * Math.random()) * (len - 24));
    const amp = (0.35 + 0.45 * Math.random()) * (Math.random() > 0.5 ? 1 : -1);
    for (let j = 0; j < 14 && pos + j < len; j++) {
      data[pos + j] += amp * Math.exp(-j / 2.6);
    }
  }

  const src = ac.createBufferSource();
  src.buffer = buf;

  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = opts.q;
  filter.frequency.setValueAtTime(opts.freqStart, t0);
  filter.frequency.exponentialRampToValueAtTime(opts.freqEnd, t0 + opts.durationSec);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(opts.gainPeak, t0 + Math.min(0.022, opts.durationSec * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.durationSec);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(t0);

  if (opts.thud) {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(opts.thud.freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(opts.thud.freqEnd, t0 + opts.thud.durationSec);

    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 210;

    const thudGain = ac.createGain();
    thudGain.gain.setValueAtTime(0.0001, t0);
    thudGain.gain.linearRampToValueAtTime(opts.thud.gain, t0 + 0.004);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.thud.durationSec);

    osc.connect(lp);
    lp.connect(thudGain);
    thudGain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + opts.thud.durationSec + 0.01);
  }
}

/** Tactile disc-on-platter settle + stylus lead-in scratch when loading a record. */
export function playDiscSwap() {
  triggerVinylSwipe({
    durationSec: 0.13,
    freqStart: 460,
    freqEnd: 880,
    q: 0.9,
    gainPeak: 0.055,
    ticks: 1,
    thud: { freqStart: 108, freqEnd: 56, durationSec: 0.032, gain: 0.045 },
  });
  triggerVinylSwipe({
    delaySec: 0.09,
    durationSec: 0.13,
    freqStart: 680,
    freqEnd: 1750,
    q: 1.3,
    gainPeak: 0.068,
    ticks: 3,
  });
}

/** Subtle stylus drop into the groove when resuming the current record. */
export function playNeedleDrop() {
  triggerVinylSwipe({
    durationSec: 0.125,
    freqStart: 660,
    freqEnd: 1700,
    q: 1.3,
    gainPeak: 0.065,
    ticks: 3,
    thud: { freqStart: 118, freqEnd: 64, durationSec: 0.022, gain: 0.035 },
  });
}

/** Soft downward scratch & cue-lever lift when pausing/stopping a record. */
export function playNeedleLift() {
  triggerVinylSwipe({
    durationSec: 0.155,
    freqStart: 1650,
    freqEnd: 520,
    q: 1.2,
    gainPeak: 0.06,
    ticks: 2,
  });
}

let globalBound = false;

/**
 * Installs one delegated pointerdown listener for interactive UI controls
 * so buttons, nav items, and cards produce a crisp click without per-component wiring.
 */
export function initGlobalSfx(): () => void {
  if (typeof window === "undefined" || globalBound) return () => {};
  globalBound = true;

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    unlockSfx();
    const target = e.target;
    if (!(target instanceof Element)) return;
    // Skip the room canvas (has custom object SFX) and the SFX toggle itself (toggles its own chime).
    if (target.closest("#scene") || target.closest("[data-sfx-toggle]")) return;
    if (target.closest("button, a, summary, [role='button']")) {
      playClick();
    }
  };

  window.addEventListener("pointerdown", onPointerDown, { capture: true, passive: true });

  return () => {
    globalBound = false;
    window.removeEventListener("pointerdown", onPointerDown, true);
  };
}
