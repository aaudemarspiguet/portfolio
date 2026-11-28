import { describe, expect, it } from "vitest";
import { FRAME, fitWideShot, floorEdge, wideFov } from "./roomFrame";

const EYE = 1.6;
const LOOK = { y: 1.52, z: -2 };

describe("wideFov", () => {
  it("keeps desktop's 50° lens on 16:9 and wider", () => {
    expect(wideFov(16 / 9)).toBeCloseTo(50, 5);
    expect(wideFov(2.4)).toBe(50);
  });

  it("opens up smoothly as the screen narrows, capped at 62°", () => {
    expect(wideFov(1.6)).toBeGreaterThan(50);
    expect(wideFov(1.6)).toBeLessThan(wideFov(1.45));
    expect(wideFov(1)).toBe(62);
    expect(wideFov(0.46)).toBe(62);
  });
});

describe("fitWideShot", () => {
  it("leaves desktop where it was (z about 4.1)", () => {
    expect(fitWideShot(16 / 9, EYE, LOOK).z).toBeCloseTo(4.07, 1);
  });

  it("brings an upright phone in from 4.6 to about 3.3", () => {
    const shot = fitWideShot(0.46, EYE, LOOK);
    expect(shot.fov).toBe(62);
    expect(shot.z).toBeGreaterThan(3.1);
    expect(shot.z).toBeLessThan(3.5);
  });

  it("starts the floor at the front of the furniture on every screen", () => {
    for (const aspect of [0.42, 0.6, 0.75, 1, 1.33, 1.6, 16 / 9, 2.2]) {
      const { fov, z } = fitWideShot(aspect, EYE, LOOK);
      expect(floorEdge(fov, z, EYE, LOOK)).toBeCloseTo(FRAME.front, 3);
    }
  });

  it("takes the #fov, #camz and #front tuning switches", () => {
    expect(fitWideShot(0.46, EYE, LOOK, { fov: 55 }).fov).toBe(55);
    expect(fitWideShot(0.46, EYE, LOOK, { z: 4.2 }).z).toBe(4.2);
    const nearer = fitWideShot(0.46, EYE, LOOK, { front: 0 });
    expect(floorEdge(nearer.fov, nearer.z, EYE, LOOK)).toBeCloseTo(0, 3);
  });
});
