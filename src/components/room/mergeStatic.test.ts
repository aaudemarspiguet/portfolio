import { beforeAll, describe, expect, it } from "vitest";
import * as THREE from "three";
import type { HomeProject } from "@/content/project-types";
import { buildRoomScene } from "./furniture";
import { mergeStaticMeshes, objectsIn } from "./mergeStatic";
import { mapRoomProjects } from "./roomData";

const mat = new THREE.MeshStandardMaterial();
const box = (x: number, parent: THREE.Object3D, m: THREE.Material = mat) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), m);
  mesh.position.x = x;
  parent.add(mesh);
  return mesh;
};
const meshes = (root: THREE.Object3D) => {
  const out: THREE.Mesh[] = [];
  root.traverse((o) => (o as THREE.Mesh).isMesh && out.push(o as THREE.Mesh));
  return out;
};
const bounds = (root: THREE.Object3D) => {
  root.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(root);
};

describe("mergeStaticMeshes", () => {
  it("folds free furniture into one mesh per material and keeps its shape", () => {
    const scene = new THREE.Scene();
    const chair = new THREE.Group();
    chair.position.set(1, 0, 2);
    scene.add(chair);
    box(0, chair);
    box(0.5, chair);
    box(3, scene);
    const before = bounds(scene);
    mergeStaticMeshes(scene, new Set());
    expect(meshes(scene)).toHaveLength(1);
    const after = bounds(scene);
    expect(after.min.distanceTo(before.min)).toBeLessThan(1e-6);
    expect(after.max.distanceTo(before.max)).toBeLessThan(1e-6);
  });

  it("keeps what the room holds on to, and merges under it only within the parent", () => {
    const scene = new THREE.Scene();
    const record = new THREE.Group();
    scene.add(record);
    const label = box(0, record);
    box(0.2, record);
    box(0.4, record);
    const loose = box(2, scene);
    mergeStaticMeshes(scene, new Set<THREE.Object3D>([record, label]));
    // The label stays itself; the other two record parts become one mesh that still turns with it.
    expect(label.parent).toBe(record);
    expect(record.children).toHaveLength(2);
    // The loose box had nothing to merge with outside the record, so it's untouched.
    expect(loose.parent).toBe(scene);
  });

  it("leaves see-through, invisible (click target) and mirrored meshes alone", () => {
    const scene = new THREE.Scene();
    const glass = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.2 });
    const hit = new THREE.MeshBasicMaterial({ visible: false });
    const a = box(0, scene, glass);
    const b = box(1, scene, glass);
    const c = box(2, scene, hit);
    const d = box(3, scene, hit);
    const m1 = box(4, scene);
    const m2 = box(5, scene);
    m1.scale.x = -1;
    m2.scale.x = -1;
    mergeStaticMeshes(scene, new Set());
    for (const m of [a, b, c, d, m1, m2]) expect(m.parent).toBe(scene);
  });
});

describe("the room after merging", () => {
  beforeAll(() => {
    // jsdom has no 2D canvas; the room only needs drawing calls to exist, not to draw.
    const noop = () => {};
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
      return new Proxy(
        { canvas: this },
        {
          get: (t, k) =>
            k in t
              ? t[k as keyof typeof t]
              : k === "measureText"
                ? () => ({ width: 10, actualBoundingBoxAscent: 5, actualBoundingBoxDescent: 5 })
                : k === "getImageData"
                  ? () => ({ data: new Uint8ClampedArray(4) })
                  : String(k).startsWith("create")
                    ? () => ({ addColorStop: noop })
                    : noop,
          set: () => true,
        },
      );
    } as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  const project = (slug: string): HomeProject => ({
    slug,
    area: "AI",
    year: "2026",
    title: slug,
    summary: "",
    lede: "",
    tags: [],
    cover: { kind: "image", src: `/projects/${slug}.jpg`, alt: "" },
  });

  it("draws in about half the calls and keeps every object the room code uses", () => {
    const scene = new THREE.Scene();
    const projects = ["find-the-outfit", "saw", "llm-ablations", "qna"].map(project);
    const refs = buildRoomScene(scene, mapRoomProjects(projects), () => {});
    let drawn = 0;
    scene.traverseVisible((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !Array.isArray(m.material) && m.material.visible) drawn++;
    });
    // 259 before merging. A budget, so a new prop that can't merge shows up here.
    expect(drawn).toBeLessThanOrEqual(140);
    const inScene = new Set<THREE.Object3D>();
    scene.traverse((o) => inScene.add(o));
    for (const o of objectsIn(refs)) {
      if (o instanceof THREE.Light || (o as THREE.Object3D).type === "Object3D") continue;
      expect(inScene.has(o)).toBe(true);
    }
  });
});
