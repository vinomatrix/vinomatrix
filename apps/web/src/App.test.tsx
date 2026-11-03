import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App.tsx";
import { fr } from "./i18n/fr.ts";

describe("App", () => {
  it("renders the French title and tagline", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(fr.app.title);
    expect(screen.getByText(fr.app.tagline)).toBeDefined();
  });
});
