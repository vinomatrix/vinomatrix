/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the API. Defaults to `/api` (Vite dev proxy).
  readonly VITE_API_URL?: string;
}
