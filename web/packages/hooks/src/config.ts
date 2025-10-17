/**
 * API Base URL Configuration
 *
 * Development (host): Uses Vite proxy /api → http://localhost:8080 (pnpm dev on port 3001)
 * Development (Docker): Uses nginx proxy /api → http://backend nodes (containerized dashboard on port 3000)
 * Production: Uses nginx proxy /api → backend nodes
 *
 * All environments use same-origin requests to avoid CORS issues.
 * Vite dev server (vite.config.ts) proxies /api and /ws to localhost:8080.
 */
export const API_BASE =
  typeof window !== 'undefined' ? window.location.origin : ''
