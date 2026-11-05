import { describe, expect, it } from "vitest";
import { toBbox } from "./bbox.ts";

const bounds = (west: number, south: number, east: number, north: number) => ({
  getWest: () => west,
  getSouth: () => south,
  getEast: () => east,
  getNorth: () => north,
});

describe("toBbox", () => {
  it("rounds outwards to 3 decimals", () => {
    expect(toBbox(bounds(6.85123, 46.95987, 6.90011, 47.00001))).toEqual([
      6.851, 46.959, 6.901, 47.001,
    ]);
  });

  it("gives the same bbox for a small pan", () => {
    expect(toBbox(bounds(6.8511, 46.9591, 6.9001, 47.0001))).toEqual(
      toBbox(bounds(6.8514, 46.9593, 6.9004, 47.0004)),
    );
  });

  it("clamps a world view to valid coordinates", () => {
    expect(toBbox(bounds(-540, -95, 540, 95))).toEqual([-180, -90, 180, 90]);
  });
});
