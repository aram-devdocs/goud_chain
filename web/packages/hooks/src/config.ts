/**
 * API Base URL Configuration
 *
 * Development: Direct call to http://localhost:8080 (no proxy needed)
 * Production: Same origin (nginx handles routing)
 */
export const API_BASE =
  typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8080'
    : typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:8080'
