/**
 * Safely extract error message from API response
 * Handles JSON parsing failures, network errors, and malformed responses
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorMessage = `Request failed with status ${response.status}`

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
