import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Dev and preview: /api/* goes to the local API server, so the browser sees one origin (no CORS).
const proxy = {
  "/api": {
    target: "http://localhost:3000",
    rewrite: (path: string) => path.replace(/^\/api/, ""),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
  test: {
    environment: "jsdom",
  },
});
