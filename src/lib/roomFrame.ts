/**
 * Fits the room's wide shot to the screen, from the room's own measurements, not from a list of
 * screens.
 *
 * The lens keeps desktop's sideways view as a screen gets narrower (up to a cap, past which a tall
 * phone frame would bend the room). Then the camera stands back just far enough for the bottom of
 * the frame to meet the floor at `front`, the front of the furniture. So every screen's view of
 * the floor starts in the same place, where a phone used to show a meter of empty boards in front
 * of the bean bag and read like a stage set.
 */
export type WideShot = { fov: number; z: number };

export const FRAME = {
  /** Desktop's lens (vertical degrees) on a 16:9 screen. */
  fov: 50,
  refAspect: 16 / 9,
  /** The widest lens a tall screen gets. */
  maxFov: 62,
  /** Where the bottom of the frame meets the floor (z). The bean bag, nearest thing, sits at 0.85. */
  front: 0.75,
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** The lens for a screen of this width/height. Wider than 16:9 keeps 50°; narrower opens up to 62°. */
export function wideFov(aspect: number) {
  const fitted = deg(2 * Math.atan((Math.tan(rad(FRAME.fov / 2)) * FRAME.refAspect) / aspect));
  return Math.min(FRAME.maxFov, Math.max(FRAME.fov, fitted));
}

/**
 * How far back (z) a camera at height `eyeY`, looking at `look`, stands so that the bottom of a
 * `fov` frame meets the floor (y = 0) at z = `front`.
 */
export function wideZ(fov: number, front: number, eyeY: number, look: { y: number; z: number }) {
  const half = rad(fov / 2);
  const drop = eyeY - look.y;
  let z = front + eyeY / Math.tan(half);
  // The camera looks slightly down at the back wall, which depends on where it stands; a few
  // rounds settle it to well under a millimetre.
  for (let i = 0; i < 4; i++) {
    const tilt = Math.atan2(drop, z - look.z);
    z = front + eyeY / Math.tan(half + tilt);
  }
  return z;
}

/** Where the bottom of the frame meets the floor, for a camera at `z` (the inverse of `wideZ`). */
export function floorEdge(fov: number, z: number, eyeY: number, look: { y: number; z: number }) {
  const tilt = Math.atan2(eyeY - look.y, z - look.z);
  return z - eyeY / Math.tan(rad(fov / 2) + tilt);
}

export function fitWideShot(
  aspect: number,
  eyeY: number,
  look: { y: number; z: number },
  override: { fov?: number | null; z?: number | null; front?: number | null } = {},
): WideShot {
  const fov = override.fov ?? wideFov(aspect);
  const z = override.z ?? wideZ(fov, override.front ?? FRAME.front, eyeY, look);
  return { fov, z };
}
