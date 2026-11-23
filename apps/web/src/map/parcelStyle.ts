import { DEFAULT_THEME } from "@mantine/core";
import type {
  ExpressionSpecification,
  FillLayerSpecification,
  FilterSpecification,
  LineLayerSpecification,
} from "maplibre-gl";
import { WINE } from "../styles/theme.ts";

// Above this share a parcel counts as mostly planted.
export const MOSTLY_PLANTED = 0.5;

// One entry per legend row. The map and the legend read the same colors.
export const PARCEL_CLASSES = [
  { key: "planted", color: WINE[8], fillOpacity: 0.45 },
  { key: "partial", color: WINE[3], fillOpacity: 0.3 },
  { key: "undeclared", color: DEFAULT_THEME.colors.gray[6], fillOpacity: 0.15 },
] as const;
export type ParcelClass = (typeof PARCEL_CLASSES)[number]["key"];

const [planted, partial, undeclared] = PARCEL_CLASSES;
// A null share (pipeline not run yet) is drawn as undeclared.
const share: ExpressionSpecification = ["coalesce", ["get", "plantedShare"], 0];

// A MapLibre `case` choosing one value per class, in PARCEL_CLASSES order.
const byClass = (
  values: readonly [string, string, string] | readonly [number, number, number],
): ExpressionSpecification => [
  "case",
  [">", share, MOSTLY_PLANTED],
  values[0],
  [">", share, 0],
  values[1],
  values[2],
];

export const FILL_PAINT: NonNullable<FillLayerSpecification["paint"]> = {
  "fill-color": byClass([planted.color, partial.color, undeclared.color]),
  "fill-opacity": byClass([planted.fillOpacity, partial.fillOpacity, undeclared.fillOpacity]),
};

export const LINE_PAINT: NonNullable<LineLayerSpecification["paint"]> = {
  "line-color": byClass([planted.color, partial.color, undeclared.color]),
  "line-width": 1,
};

// Parcels with at least some declared vines.
export const WITH_VINES: FilterSpecification = [">", share, 0];
