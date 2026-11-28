import * as THREE from "three";

/**
 * Turns the phone's motion sensor (deviceorientation) into a small head turn for the room:
 * how far the phone has turned left/right and tilted up/down since it was last centred.
 *
 * It works from relative angles, so it doesn't matter how the phone was held when looking began
 * (sitting, standing, lying back): each centring takes the current pose as straight ahead. With the
 * phone flat (screen up or down) there's no "ahead" to measure from, so it waits until it's lifted.
 */

const Z_AXIS = new THREE.Vector3(0, 0, 1);
// The sensor's frame has the phone lying flat; this stands it up so its back camera looks along -z.
const STAND_UP = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
const euler = new THREE.Euler();
const q = new THREE.Quaternion();
const qScreen = new THREE.Quaternion();

/** Below this much level reach, the phone points too nearly straight up or down to read a turn. */
export const FLAT = 0.2;
export const TILT_MAX_YAW = 0.6;
export const TILT_MAX_PITCH = 0.3;

const rad = THREE.MathUtils.degToRad;

/**
 * The direction the phone's back faces, in the room's frame (y up, ahead is -z), from a
 * deviceorientation event's angles (degrees) and the screen's rotation (degrees).
 */
export function deviceLookDir(alpha: number, beta: number, gamma: number, screenDeg: number, out: THREE.Vector3) {
  euler.set(rad(beta), rad(alpha), -rad(gamma), "YXZ");
  q.setFromEuler(euler).multiply(STAND_UP).multiply(qScreen.setFromAxisAngle(Z_AXIS, -rad(screenDeg)));
  return out.set(0, 0, -1).applyQuaternion(q);
}

/** Level reach of a direction: 1 looking straight ahead, 0 straight up or down. */
export function levelReach(dir: THREE.Vector3) {
  return Math.hypot(dir.x, dir.z);
}

/**
 * The head turn (radians, left and up positive, like the room's own yaw) from `ref` to `dir`, kept
 * within the limits. `prevYaw` is kept when the phone points too nearly up or down to read a turn.
 */
export function tiltOffsets(dir: THREE.Vector3, ref: THREE.Vector3, prevYaw = 0) {
  let yaw = prevYaw;
  if (levelReach(dir) > FLAT && levelReach(ref) > FLAT) {
    const d = Math.atan2(dir.x, dir.z) - Math.atan2(ref.x, ref.z);
    yaw = Math.atan2(Math.sin(d), Math.cos(d));
  }
  const pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)) - Math.asin(THREE.MathUtils.clamp(ref.y, -1, 1));
  return {
    yaw: THREE.MathUtils.clamp(yaw, -TILT_MAX_YAW, TILT_MAX_YAW),
    pitch: THREE.MathUtils.clamp(pitch, -TILT_MAX_PITCH, TILT_MAX_PITCH),
  };
}
