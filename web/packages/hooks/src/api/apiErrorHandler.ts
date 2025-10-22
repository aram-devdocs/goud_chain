/**
 * Safely extract error message from API response
 * Handles JSON parsing failures, network errors, and malformed responses
 * Triggers logout on 401 Unauthorized errors
 * Redirects to service issues page on 5xx errors
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `Request failed with status ${response.status}`

  // Handle 401 Unauthorized - session expired
  if (response.status === 401) {
    // Clear invalid tokens
    localStorage.removeItem('session_token')
    localStorage.removeItem('api_key')
    localStorage.removeItem('user_id')

    // Redirect to auth page if not already there
    if (!window.location.pathname.includes('/auth')) {
      window.location.href = '/auth'
    }

    errorMessage = 'Session expired. Please log in again.'
  }

  // Handle 5xx Server Errors - service overload or issues
  if (response.status >= 500 && response.status < 600) {
    // Redirect to service unavailable page if not already there
    if (!window.location.pathname.includes('/service-unavailable')) {
      window.location.href = '/service-unavailable'
    }

    errorMessage = 'Service temporarily unavailable. Please try again later.'
  }

  try {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const errorData = (await response.json()) as { error?: string }
      if (errorData.error) {
        errorMessage = errorData.error
      }
    } else {
      // Non-JSON response (e.g., HTML error page)
      const text = await response.text()
      if (text.length > 0 && text.length < 200) {
        errorMessage = text
      }
    }
  } catch {
    // Failed to parse error response - use default message
  }

  throw new Error(errorMessage)
}

/**
 * Safely parse JSON response with error handling
 */
export async function safeJsonParse<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T
  } catch (error) {
    throw new Error(
      `Failed to parse response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
