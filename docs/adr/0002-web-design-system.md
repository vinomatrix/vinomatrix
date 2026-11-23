# 0002 — Web design system: Mantine

- Status: accepted
- Date: 2026-11-23

## Context

`apps/web` started with native HTML, CSS modules and a hand-written `tokens.css`. That was enough for a full-screen map and a title. The next milestones add a map legend and filters (#38), a parcel panel (M2) and the decoder form (M3): switches, selects, panels, alerts, later dialogs. Built by hand, each control is slow to write and easy to get wrong on accessibility (focus, keyboard, ARIA). We also want one place for colors and a dark scheme that follows the OS.

## Options

| Option              | For                                                                               | Against                                                               |
| ------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Native + tokens     | No dependency, full control                                                       | Every accessible control written and tested by us                     |
| **Mantine**         | Wide component set, accessible; styles are CSS modules + CSS variables; theme API | Bigger bundle; one more library to keep in step with React            |
| React Aria + tokens | Best-in-class accessibility, headless, our own look                               | Styling every component ourselves: a design system project in itself  |
| Radix Themes        | Sober look, simple theming                                                        | Fewer components (no form helpers, notifications)                     |
| MUI                 | Most used, very complete                                                          | CSS-in-JS (Emotion) against our CSS modules convention; Material look |

## Decision

Mantine (`@mantine/core`, `@mantine/hooks`), pinned versions.

- `apps/web/src/styles/theme.ts` is the single source for the visual identity: a `wine` palette as primary color (shade 8 on light, 4 on dark), a warm `dark` palette, text color, font family, default radius. Spacing, font sizes, line heights and shadows keep Mantine's scale.
- `MantineProvider` in `main.tsx` with `defaultColorScheme="auto"`: the scheme follows the OS.
- Styling order: Mantine props (`p="md"`, `c="dimmed"`), then CSS modules reading `--mantine-*` variables. `tokens.css` is removed. No Tailwind, no CSS-in-JS.
- MapLibre paint cannot read CSS variables: map layers import hex values from `theme.ts`.
- Tests render through `renderWithTheme` (`src/test/render.tsx`); `src/test/setup.ts` stubs `matchMedia` for jsdom.

## Consequences

- New UI is composed from Mantine components; custom CSS is limited to layout over the map.
- The look changes with one file. Dark mode needs no extra CSS.
- Mantine is part of the bundle and of dependency bumps; a major upgrade is a dedicated issue.
- Not every Mantine package is in: `@mantine/form`, `dates`, `notifications` are added at their first real use.
