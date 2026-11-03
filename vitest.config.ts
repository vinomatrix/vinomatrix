import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*", "apps/*"],
    exclude: [...configDefaults.exclude, "skills/external/**"],
    passWithNoTests: true,
  },
});
