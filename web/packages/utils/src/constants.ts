/**
 * Application-wide constants
 * Centralized location for all magic strings and numbers per CLAUDE.md
 */

/**
 * External service URLs
 */
export const EXTERNAL_URLS = {
  STATUS_PAGE: 'https://status.goudchain.com',
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  SESSION_EXPIRED: 'Session expired. Please log in again.',
  SERVICE_UNAVAILABLE:
    'Service temporarily unavailable. Please try again later.',
} as const

/**
 * Route paths
 */
export const ROUTES = {
  AUTH: '/auth',
  SERVICE_UNAVAILABLE: '/service-unavailable',
  HOME: '/',
} as const
