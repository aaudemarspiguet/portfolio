import * as THREE from "three";
import type { HomeProject } from "@/content/project-types";

export type RecordTrack = {
  id: string;
  title: string;
  src: string;
  labelColor: string;
  /** Ambient gain multiplier (all audio files are mastered to -16 LUFS). */
  volume: number;
};

/** Server-hosted tracks playable on the room's turntable and vinyl crate. */
export const RECORD_TRACKS: readonly RecordTrack[] = [
  { id: "track-01", title: "track 01 180", src: "/audio/track-01.mp3", labelColor: "#ff3b1f", volume: 0.155 },
  { id: "track-02", title: "track 02 94", src: "/audio/track-02.m4a", labelColor: "#1d5bd6", volume: 0.155 },
  { id: "track-03", title: "track 03 118", src: "/audio/track-03.m4a", labelColor: "#d49a1a", volume: 0.155 },
];

export type RoomProjectSpec = {
  project: HomeProject;
  spot: readonly [number, number, number];
  ar: number;
  crop?: number;
};

const CANVAS_SPECS: Record<string, { spot: readonly [number, number, number]; ar: number; crop?: number }> = {
  "find-the-outfit": { spot: [0.12, 1.66, 1.2], ar: 780 / 1688 },
  "llm-ablations": { spot: [1.1, 2.3, 1.2], ar: 1784 / 882 },
  saw: { spot: [1.1, 1.42, 0.84], ar: 1600 / 1200 },
  qna: { spot: [2.26, 1.72, 0.96], ar: 1280 / 800, crop: 0.86 },
};

export function mapRoomProjects(projects: HomeProject[]): RoomProjectSpec[] {
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

export type Poly2 = readonly (readonly [number, number])[];

/** Normalized layered silhouettes (white felt backing, black shadow, cardinal red W) for the UW wall crest. */
export const WISCONSIN_W_LAYERS: readonly { points: Poly2; color: number; depth: number; z: number }[] = [
  {
    color: 0xf4f2ec,
    depth: 0.011,
    z: 0,
    points: [
      [0.2586, 0.4724], [0.4639, 0.4724], [0.4886, 0.4686], [0.5, 0.4534], [0.5, 0.385],
      [0.4772, 0.1721], [0.4316, 0.1188], [0.3023, -0.2937], [0.2624, -0.3184], [0.1996, -0.3184],
      [0.1065, -0.3013], [-0.0266, -0.3051], [-0.0418, -0.3184], [-0.1578, -0.3736], [-0.2053, -0.4173],
      [-0.2452, -0.4686], [-0.3061, -0.4724], [-0.3194, -0.4667], [-0.4354, -0.1321], [-0.4506, -0.1112],
      [-0.4905, -0.1074], [-0.5, -0.0922], [-0.5, -0.0276], [-0.4753, 0.1949], [-0.4487, 0.2348],
      [-0.4411, 0.2595], [-0.3536, 0.326], [-0.2015, 0.3964], [-0.154, 0.3983], [-0.116, 0.4211],
      [0.0247, 0.4515],
    ],
  },
  {
    color: 0x161618,
    depth: 0.007,
    z: 0.011,
    points: [
      [0.2928, 0.4325], [0.4297, 0.4325], [0.4582, 0.4287], [0.4601, 0.4192], [0.4354, 0.1968],
      [0.4049, 0.1816], [0.3935, 0.1625], [0.2624, -0.2614], [0.2433, -0.2595], [0.2376, -0.2785],
      [0.1977, -0.2671], [0.1122, -0.2576], [0.1103, -0.2614], [0.0875, -0.2576], [0.0133, -0.2652],
      [-0.0209, -0.134], [-0.0456, -0.2538], [-0.0589, -0.2595], [-0.0798, -0.2576], [-0.0722, -0.2614],
      [-0.0741, -0.2785], [-0.1369, -0.2994], [-0.2015, -0.3375], [-0.2529, -0.3869], [-0.2814, -0.4325],
      [-0.3726, -0.1663], [-0.3688, -0.1606], [-0.3745, -0.1587], [-0.403, -0.0751], [-0.424, -0.0561],
      [-0.4563, -0.0618], [-0.4601, -0.0694], [-0.4354, 0.1606], [-0.4316, 0.174], [-0.4049, 0.1949],
      [-0.403, 0.2215], [-0.2966, 0.2975], [-0.1825, 0.3508], [-0.154, 0.3584], [-0.1768, 0.115],
      [-0.192, 0.0922], [-0.1977, 0.0694], [-0.1711, -0.0599], [-0.1635, -0.0466], [-0.1312, 0.0941],
      [-0.1426, 0.1112], [-0.154, 0.115], [-0.154, 0.1302], [-0.1293, 0.3375], [-0.1027, 0.347],
      [-0.0989, 0.3736], [-0.0875, 0.3793], [0.038, 0.4078], [0.1274, 0.4192], [0.1084, 0.1949],
      [0.1046, 0.1759], [0.0913, 0.1644], [0.0856, 0.1492], [0.0856, 0.1264], [0.1122, 0.0124],
      [0.1521, 0.1435], [0.1483, 0.1587], [0.1274, 0.1721], [0.1521, 0.3945], [0.1768, 0.3964],
      [0.1787, 0.4192], [0.1844, 0.4249],
    ],
  },
  {
    color: 0xc5050c, // UW-Madison Badger Red (#C5050C, the screen spec)
    depth: 0.01,
    z: 0.018,
    points: [
      [0.2928, 0.4325], [0.4297, 0.4325], [0.4582, 0.4287], [0.4601, 0.4192], [0.4354, 0.1968],
      [0.4049, 0.1816], [0.3935, 0.1625], [0.2624, -0.2614], [0.2452, -0.2595], [0.2452, -0.2519],
      [0.23, -0.2481], [0.154, -0.2348], [0.0608, -0.2348], [0.0589, -0.231], [0.0323, -0.2348],
      [0.0266, -0.2272], [0.0114, -0.1416], [-0.0095, -0.0656], [-0.0247, -0.1264], [-0.0228, -0.1435],
      [-0.0456, -0.2538], [-0.0589, -0.2595], [-0.0703, -0.2557], [-0.0894, -0.2595], [-0.1445, -0.2785],
      [-0.1882, -0.3013], [-0.2395, -0.3394], [-0.2757, -0.3812], [-0.3859, -0.0447], [-0.403, -0.0295],
      [-0.4278, -0.0333], [-0.403, 0.2215], [-0.3612, 0.2557], [-0.2966, 0.2975], [-0.1825, 0.3508],
      [-0.154, 0.3584], [-0.1768, 0.115], [-0.192, 0.0922], [-0.1977, 0.0694], [-0.1958, 0.0428],
      [-0.173, -0.0523], [-0.1749, -0.0618], [-0.1635, -0.1093], [-0.1578, -0.115], [-0.1046, 0.0865],
      [-0.1046, 0.1131], [-0.116, 0.1283], [-0.1236, 0.1302], [-0.1236, 0.1454], [-0.0989, 0.3375],
      [-0.1027, 0.3527], [-0.0989, 0.3736], [-0.0019, 0.4002], [0.1274, 0.4192], [0.1084, 0.1949],
      [0.1046, 0.1759], [0.0913, 0.1644], [0.0856, 0.1492], [0.0856, 0.1264], [0.1103, 0.02],
      [0.1084, 0.0067], [0.1236, -0.0428], [0.1369, -0.0105], [0.1806, 0.153], [0.1749, 0.1778],
      [0.1559, 0.1911], [0.1787, 0.3698], [0.1787, 0.4192], [0.1996, 0.4268],
    ],
  },
];
