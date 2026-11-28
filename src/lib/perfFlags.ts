/**
 * Switches for testing the room's speed on a real phone, read from the address's #hash (Vercel's
 * preview sign-in drops ?query, so a hash survives it). Open the site with, for example:
 *
 *   #debug                 show the readout (frame rate, frame time, draw calls, pixel ratio)
 *   #debug&dpr=1           draw at 1x pixel ratio instead of the phone's 1.5x
 *   #debug&noaa            no antialiasing
 *   #debug&noshadow        no shadows
 *   #debug&noglass         no blur behind the glass bars and buttons
 *
 * And for tuning the room's wide shot on a phone (see lib/roomFrame):
 *
 *   #fov=55                lens, in vertical degrees, instead of the fitted one
 *   #front=0.4             where the bottom of the frame meets the floor (z; furniture sits from 0.85 back)
 *   #camz=3.8              where the camera stands (z), instead of the fitted distance
 *
 * Any of them can be combined. Changing them reloads the page, since some only apply at startup.
 */
export type PerfFlags = {
  debug: boolean;
  dpr: number | null;
  noaa: boolean;
  noshadow: boolean;
  noglass: boolean;
  fov: number | null;
  front: number | null;
  camz: number | null;
};

export function readPerfFlags(hash: string): PerfFlags {
  const parts = hash
    .replace(/^#/, "")
    .split(/[&,;]/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const has = (k: string) => parts.includes(k);
  // A number switch like "dpr=1.5", kept only inside a sensible range.
  const num = (k: string, min: number, max: number) => {
    const part = parts.find((p) => p.startsWith(`${k}=`));
    const n = part ? Number(part.slice(k.length + 1)) : NaN;
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };
  return {
    debug: has("debug"),
    dpr: num("dpr", 0.5, 3),
    noaa: has("noaa"),
    noshadow: has("noshadow"),
    noglass: has("noglass"),
    fov: num("fov", 20, 100),
    front: num("front", -2.5, 3),
    camz: num("camz", 1, 8),
  };
}

/** True when two flag sets would set the room up differently (so a hash change needs a reload). */
export function perfFlagsDiffer(a: PerfFlags, b: PerfFlags) {
  return (Object.keys(a) as (keyof PerfFlags)[]).some((k) => a[k] !== b[k]);
}
