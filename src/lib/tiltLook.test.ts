import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { deviceLookDir, levelReach, tiltOffsets, TILT_MAX_YAW } from "./tiltLook";

const deg = THREE.MathUtils.degToRad;
const dir = (a: number, b: number, g: number, s = 0) => deviceLookDir(a, b, g, s, new THREE.Vector3());

describe("deviceLookDir", () => {
  it("looks straight ahead with the phone held upright", () => {
    const d = dir(0, 90, 0);
    expect(d.x).toBeCloseTo(0, 5);
    expect(d.y).toBeCloseTo(0, 5);
    expect(d.z).toBeCloseTo(-1, 5);
  });

  it("looks down with the phone flat, screen up", () => {
    expect(dir(0, 0, 0).y).toBeCloseTo(-1, 5);
    expect(levelReach(dir(0, 0, 0))).toBeLessThan(0.01);
  });

  it("holds level in landscape too", () => {
    // Turned on its side (screen rotated 90°), held upright: the left edge up.
    const d = dir(0, 0, -90, 90);
    expect(d.y).toBeCloseTo(0, 5);
    expect(levelReach(d)).toBeCloseTo(1, 5);
  });
});

describe("tiltOffsets", () => {
  const ref = dir(0, 90, 0);

  it("turns left (positive, like the room's yaw) when the phone turns left", () => {
    // alpha grows counterclockwise seen from above: a turn to the left.
    const { yaw, pitch } = tiltOffsets(dir(20, 90, 0), ref);
    expect(yaw).toBeCloseTo(deg(20), 4);
    expect(pitch).toBeCloseTo(0, 4);
  });

  it("looks up when the phone tilts back", () => {
    const { yaw, pitch } = tiltOffsets(dir(0, 100, 0), ref);
    expect(pitch).toBeCloseTo(deg(10), 4);
    expect(yaw).toBeCloseTo(0, 4);
  });

  it("is relative to the pose it was centred on, however the phone is held", () => {
    // Lying back, phone tipped well past upright: still reads as no turn until it moves.
    const lyingRef = dir(40, 140, 0);
    const still = tiltOffsets(dir(40, 140, 0), lyingRef);
    expect(still.yaw).toBeCloseTo(0, 5);
    expect(still.pitch).toBeCloseTo(0, 5);
  });

  it("stays inside its limits and keeps the last turn when pointed straight down", () => {
    expect(tiltOffsets(dir(120, 90, 0), ref).yaw).toBe(TILT_MAX_YAW);
    expect(tiltOffsets(dir(0, 0, 0), ref, 0.2).yaw).toBe(0.2);
  });
});
