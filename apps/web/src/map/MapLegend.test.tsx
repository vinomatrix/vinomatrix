import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fr } from "../i18n/fr.ts";
import { renderWithTheme } from "../test/render.tsx";
import { MapLegend } from "./MapLegend.tsx";

describe("MapLegend", () => {
  it("lists one row per parcel class", () => {
    renderWithTheme(<MapLegend hideUndeclared={false} onHideUndeclaredChange={() => undefined} />);

    const legend = screen.getByRole("region", { name: fr.legend.title });
    expect(legend.querySelectorAll("li")).toHaveLength(3);
    for (const label of [fr.legend.planted, fr.legend.partial, fr.legend.undeclared]) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it("reports the toggle state", () => {
    const onChange = vi.fn();
    const { rerender } = renderWithTheme(
      <MapLegend hideUndeclared={false} onHideUndeclaredChange={onChange} />,
    );

    const toggle = screen.getByRole("switch", { name: fr.legend.hideUndeclared });
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(true);

    rerender(<MapLegend hideUndeclared onHideUndeclaredChange={onChange} />);
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenLastCalledWith(false);
  });
});
