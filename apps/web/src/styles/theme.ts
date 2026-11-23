import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Wine accent, lightest to darkest. Shade 8 is the accent on light backgrounds, shade 4 on dark ones.
export const WINE: MantineColorsTuple = [
  "#fbeef2",
  "#f3d6df",
  "#e8aabd",
  "#de7d99",
  "#d9668a",
  "#c4466e",
  "#a8325a",
  "#8f2748",
  "#7b1e3a",
  "#5e152c",
];

// Warm dark scheme: Mantine reads text from shade 0, dimmed text from 2 and backgrounds from 7.
const DARK: MantineColorsTuple = [
  "#f2eaec",
  "#d9cdd1",
  "#b3a4a9",
  "#8a7a80",
  "#5c4d52",
  "#3d3135",
  "#2e2428",
  "#241c1f",
  "#1a1416",
  "#120d0f",
];

// Single source for colors, fonts and radius. Our CSS modules read the generated --mantine-* variables.
export const theme = createTheme({
  colors: { wine: WINE, dark: DARK },
  primaryColor: "wine",
  primaryShade: { light: 8, dark: 4 },
  black: "#2a2024",
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  defaultRadius: "md",
});
