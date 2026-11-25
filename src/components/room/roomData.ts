import * as THREE from "three";
import type { Project } from "@/content/projects";

export type RoomProjectSpec = {
  project: Project;
  spot: readonly [number, number, number];
  ar: number;
  crop?: number;
};

const CANVAS_SPECS: Record<string, { spot: readonly [number, number, number]; ar: number; crop?: number }> = {
  "find-the-outfit": { spot: [0.12, 1.66, 1.2], ar: 657 / 1421 },
  "llm-ablations": { spot: [1.1, 2.3, 1.2], ar: 1784 / 882 },
  saw: { spot: [1.1, 1.42, 0.84], ar: 1600 / 1200 },
  qna: { spot: [2.26, 1.72, 0.96], ar: 1280 / 800, crop: 0.86 },
};

export function mapRoomProjects(projects: Project[]): RoomProjectSpec[] {
  return projects.map((project) => {
    const spec = CANVAS_SPECS[project.slug] ?? { spot: [0, 1.7, 1.0] as const, ar: 1.5 };
    return {
      project,
      spot: spec.spot,
      ar: spec.ar,
      crop: spec.crop,
    };
  });
}

/**
 * Convert a hex literal tuned in non-color-managed Three.js r128 (linear)
 * into a THREE.Color whose linear channel values match r128 identically.
 */
export function linearColor(hex: number): THREE.Color {
  return new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
