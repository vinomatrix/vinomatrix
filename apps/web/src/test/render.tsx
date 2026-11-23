import { MantineProvider } from "@mantine/core";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { theme } from "../styles/theme.ts";

// Mantine components need their provider, as in main.tsx.
export const renderWithTheme = (ui: ReactElement) =>
  render(ui, {
    wrapper: ({ children }) => <MantineProvider theme={theme}>{children}</MantineProvider>,
  });
