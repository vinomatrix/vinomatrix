import type { Bbox } from "@vinomatrix/domain/schema";

interface Bounds {
  getWest(): number;
  getSouth(): number;
  getEast(): number;
  getNorth(): number;
}

// 3 decimals ≈ 100 m. Rounding outwards keeps the whole view covered, and small pans
// produce the same bbox, so TanStack Query serves them from cache.
const STEP = 1000;
const down = (value: number) => Math.floor(value * STEP) / STEP;
const up = (value: number) => Math.ceil(value * STEP) / STEP;
const clamp = (value: number, limit: number) => Math.min(limit, Math.max(-limit, value));

export const toBbox = (bounds: Bounds): Bbox => [
  clamp(down(bounds.getWest()), 180),
  clamp(down(bounds.getSouth()), 90),
  clamp(up(bounds.getEast()), 180),
  clamp(up(bounds.getNorth()), 90),
];
