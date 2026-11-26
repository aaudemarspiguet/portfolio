import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Folds the room's static meshes into fewer, bigger ones so a frame costs fewer draw calls.
 *
 * The room is built from about 260 small meshes, and each one is its own draw call every frame
 * (and once per shadow map face when shadows redraw). Phones pay for every call on the CPU, so
 * dragging the view feels heavy even though the room is only ~17k triangles.
 *
 * Meshes merge when they share a material object, shadow flags and vertex layout. Where they merge
 * depends on what's above them:
 * - Under anything the room code holds on to (`keep`: what it animates, clicks or spotlights in the
 *   tour) they merge only with siblings, inside their parent, so the record, tone arm, fan and
 *   guitar still move with all their parts and the tour still lights the same shapes.
 * - Furniture nothing refers to (the couch, chair, coat rack) never moves, so its meshes merge
 *   across groups into the room itself.
 * Anything kept, clickable, see-through, mirrored or carrying userData is left exactly as built.
 */
export function mergeStaticMeshes(root: THREE.Object3D, keep: ReadonlySet<THREE.Object3D>) {
  root.updateMatrixWorld(true);
  // Kept objects and everything above them: a mesh under any of these stays with its parent.
  const pinned = new Set<THREE.Object3D>();
  keep.forEach((k) => {
    for (let o: THREE.Object3D | null = k; o && o !== root; o = o.parent) pinned.add(o);
  });
  const toRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map<string, { parent: THREE.Object3D; meshes: THREE.Mesh[]; matrices: THREE.Matrix4[] }>();

  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.parent || keep.has(m) || m.children.length) return;
    if ((m as THREE.Mesh & { isInstancedMesh?: boolean }).isInstancedMesh) return;
    if ((m as unknown as THREE.SkinnedMesh).isSkinnedMesh) return;
    const mat = m.material;
    if (Array.isArray(mat) || !mat.visible || mat.transparent) return;
    if (!m.visible || m.renderOrder !== 0 || !m.frustumCulled || m.layers.mask !== 1) return;
    if (Object.keys(m.userData).length) return;
    const g = m.geometry;
    if (Object.keys(g.morphAttributes).length) return;
    let free = true;
    for (let a: THREE.Object3D | null = m.parent; a && a !== root; a = a.parent) {
      if (pinned.has(a)) {
        free = false;
        break;
      }
    }
    const parent = free ? root : m.parent;
    const matrix = free ? new THREE.Matrix4().multiplyMatrices(toRoot, m.matrixWorld) : m.matrix.clone();
    // A mirrored transform flips the triangle winding once it's baked in, so faces would turn away.
    if (matrix.determinant() < 0) return;
    const layout = Object.keys(g.attributes)
      .sort()
      .map((k) => `${k}:${g.attributes[k].itemSize}`)
      .join(",");
    const key = [parent.uuid, mat.uuid, m.castShadow, m.receiveShadow, g.index ? "i" : "n", layout].join("|");
    const bucket = buckets.get(key) ?? { parent, meshes: [], matrices: [] };
    bucket.meshes.push(m);
    bucket.matrices.push(matrix);
    buckets.set(key, bucket);
  });

  const dropped = new Set<THREE.BufferGeometry>();
  let merged = 0;
  for (const { parent, meshes, matrices } of buckets.values()) {
    if (meshes.length < 2) continue;
    const parts = meshes.map((m, i) => {
      const g = m.geometry.clone();
      g.applyMatrix4(matrices[i]);
      return g;
    });
    const geo = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    if (!geo) continue;
    const first = meshes[0];
    const mesh = new THREE.Mesh(geo, first.material);
    mesh.name = "merged";
    mesh.castShadow = first.castShadow;
    mesh.receiveShadow = first.receiveShadow;
    parent.add(mesh);
    meshes.forEach((m) => {
      m.removeFromParent();
      dropped.add(m.geometry);
    });
    merged += meshes.length - 1;
  }

  // A geometry can be shared (the guitar body and its binding), so only free ones nothing uses now.
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh) dropped.delete(m.geometry);
  });
  dropped.forEach((g) => g.dispose());
  return merged;
}

/** Every object a refs bag points at, one level into nested records (the canvas entries). */
export function objectsIn(refs: Record<string, unknown>): Set<THREE.Object3D> {
  const out = new Set<THREE.Object3D>();
  const visit = (v: unknown, depth: number) => {
    if (!v || typeof v !== "object") return;
    if ((v as THREE.Object3D).isObject3D) {
      out.add(v as THREE.Object3D);
      return;
    }
    if (depth > 2) return;
    for (const inner of Object.values(v as Record<string, unknown>)) visit(inner, depth + 1);
  };
  visit(refs, 0);
  return out;
}
