import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App.tsx";
import { fr } from "./i18n/fr.ts";
import { renderWithTheme } from "./test/render.tsx";

// jsdom has no WebGL, so MapLibre cannot render here.
vi.mock("./map/ParcelMap.tsx", () => ({ ParcelMap: () => <div data-testid="map" /> }));

describe("App", () => {
  it("renders the map with the French title and tagline", () => {
    renderWithTheme(<App />);
    expect(screen.getByTestId("map")).toBeDefined();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(fr.app.title);
    expect(screen.getByText(fr.app.tagline)).toBeDefined();
  });
});
