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
 * Any of them can be combined. Changing them reloads the page, since some only apply at startup.
 */
export type PerfFlags = {
  debug: boolean;
  dpr: number | null;
  noaa: boolean;
  noshadow: boolean;
  noglass: boolean;
};

export function readPerfFlags(hash: string): PerfFlags {
  const parts = hash
    .replace(/^#/, "")
    .split(/[&,;]/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const has = (k: string) => parts.includes(k);
  const dprPart = parts.find((p) => p.startsWith("dpr="));
  const dprNum = dprPart ? Number(dprPart.slice(4)) : NaN;
  return {
    debug: has("debug"),
    dpr: Number.isFinite(dprNum) && dprNum >= 0.5 && dprNum <= 3 ? dprNum : null,
    noaa: has("noaa"),
    noshadow: has("noshadow"),
    noglass: has("noglass"),
  };
}

/** True when two flag sets would set the room up differently (so a hash change needs a reload). */
export function perfFlagsDiffer(a: PerfFlags, b: PerfFlags) {
  return a.debug !== b.debug || a.dpr !== b.dpr || a.noaa !== b.noaa || a.noshadow !== b.noshadow || a.noglass !== b.noglass;
}
