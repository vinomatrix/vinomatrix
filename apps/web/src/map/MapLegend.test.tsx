import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fr } from "../i18n/fr.ts";
import { renderWithTheme } from "../test/render.tsx";
import { MapLegend } from "./MapLegend.tsx";

describe("MapLegend", () => {
  it("lists one row per parcel class", () => {
    renderWithTheme(<MapLegend plantedOnly={false} onPlantedOnlyChange={() => undefined} />);

    const legend = screen.getByRole("region", { name: fr.legend.title });
    expect(legend.querySelectorAll("li")).toHaveLength(3);
    for (const label of [fr.legend.planted, fr.legend.sparse, fr.legend.unknown]) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it("reports the toggle state", () => {
    const onChange = vi.fn();
    const { rerender } = renderWithTheme(
      <MapLegend plantedOnly={false} onPlantedOnlyChange={onChange} />,
    );

    const toggle = screen.getByRole("switch", { name: fr.legend.plantedOnly });
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<MapLegend plantedOnly onPlantedOnlyChange={onChange} />);
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});
