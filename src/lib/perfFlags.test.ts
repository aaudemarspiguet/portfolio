import { describe, expect, it } from "vitest";
import { perfFlagsDiffer, readPerfFlags } from "./perfFlags";

describe("readPerfFlags", () => {
  it("is all off with no hash", () => {
    expect(readPerfFlags("")).toEqual({
      debug: false,
      dpr: null,
      noaa: false,
      noshadow: false,
      noglass: false,
      fov: null,
      front: null,
      camz: null,
    });
  });

  it("reads combined switches in any order and separator", () => {
    expect(readPerfFlags("#noglass&debug,dpr=1;noshadow")).toEqual({
      debug: true,
      dpr: 1,
      noaa: false,
      noshadow: true,
      noglass: true,
      fov: null,
      front: null,
      camz: null,
    });
  });

  it("reads the wide-shot tuning switches, within sensible ranges", () => {
    const f = readPerfFlags("#debug&fov=55&front=0.4&camz=3.8");
    expect([f.fov, f.front, f.camz]).toEqual([55, 0.4, 3.8]);
    expect(readPerfFlags("#fov=500&camz=-1&front=x")).toMatchObject({ fov: null, camz: null, front: null });
    expect(perfFlagsDiffer(readPerfFlags("#camz=3"), readPerfFlags("#camz=3.5"))).toBe(true);
  });

  it("ignores a pixel ratio that isn't a sensible number", () => {
    expect(readPerfFlags("#debug&dpr=abc").dpr).toBeNull();
    expect(readPerfFlags("#debug&dpr=9").dpr).toBeNull();
    expect(readPerfFlags("#debug&dpr=0.75").dpr).toBe(0.75);
  });

  it("leaves ordinary anchors alone", () => {
    expect(readPerfFlags("#main")).toEqual(readPerfFlags(""));
    expect(perfFlagsDiffer(readPerfFlags("#main"), readPerfFlags(""))).toBe(false);
    expect(perfFlagsDiffer(readPerfFlags("#debug"), readPerfFlags("#debug&noaa"))).toBe(true);
  });
});
