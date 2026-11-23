import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom has no matchMedia; MantineProvider reads it for the color scheme. Always "no match".
Object.defineProperty(window, "matchMedia", {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

// Testing Library only cleans up by itself with vitest globals, which we do not enable.
afterEach(cleanup);
