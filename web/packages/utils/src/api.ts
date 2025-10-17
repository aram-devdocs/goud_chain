/**
 * API Base URL Configuration
 *
 * Development: Direct call to http://localhost:8080 (no proxy)
 * Production: Same origin (nginx proxies /api to backend)
 */
export const API_BASE =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:8080'
