import { DEFAULT_THEME } from "@mantine/core";
import type {
  ExpressionSpecification,
  FillLayerSpecification,
  FilterSpecification,
  LineLayerSpecification,
} from "maplibre-gl";
import { WINE } from "../styles/theme.ts";

// Above this share a parcel counts as planted: same threshold for the colors and the toggle.
export const PLANTED_THRESHOLD = 0.5;

// One entry per legend row. The map and the legend read the same colors.
export const PARCEL_CLASSES = [
  { key: "planted", color: WINE[8], fillOpacity: 0.45 },
  { key: "sparse", color: WINE[3], fillOpacity: 0.2 },
  { key: "unknown", color: DEFAULT_THEME.colors.gray[6], fillOpacity: 0.2 },
] as const;
export type ParcelClass = (typeof PARCEL_CLASSES)[number]["key"];

const [planted, sparse, unknown] = PARCEL_CLASSES;
const share: ExpressionSpecification = ["get", "plantedShare"];

// A MapLibre `case` choosing one value per class, in PARCEL_CLASSES order.
const byClass = (
  values: readonly [string, string, string] | readonly [number, number, number],
): ExpressionSpecification => [
  "case",
  ["==", share, null],
  values[2],
  [">", share, PLANTED_THRESHOLD],
  values[0],
  values[1],
];

export const FILL_PAINT: NonNullable<FillLayerSpecification["paint"]> = {
  "fill-color": byClass([planted.color, sparse.color, unknown.color]),
  "fill-opacity": byClass([planted.fillOpacity, sparse.fillOpacity, unknown.fillOpacity]),
};

export const LINE_PAINT: NonNullable<LineLayerSpecification["paint"]> = {
  "line-color": byClass([planted.color, sparse.color, unknown.color]),
  "line-width": 1,
};

// Planted parcels only; null shares compare as 0.
export const PLANTED_ONLY: FilterSpecification = [">", ["coalesce", share, 0], PLANTED_THRESHOLD];
