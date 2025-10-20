/**
 * Authentication manager with dual-token strategy.
 *
 * Authentication modes:
 * - API Key: Used for /data/submit endpoint (encryption operations)
 * - Session Token: JWT token for all other authenticated endpoints
 *
 * Features:
 * - Automatic token refresh before expiry
 * - Dual storage (memory + localStorage)
 * - Correct token selection per endpoint
 */

export interface AuthState {
  /** API key (base64-encoded, stored for encryption) */
  apiKey: string | null
  /** JWT session token (expires after 1 hour) */
  sessionToken: string | null
  /** User account ID (SHA-256 hash of API key) */
  userId: string | null
  /** Token expiration timestamp (Unix timestamp in milliseconds) */
  expiresAt: number | null
}

export interface LoginResponse {
  session_token: string
  expires_in: number // seconds
  account_id: string
}

/**
 * Manages authentication state and token lifecycle for Goud Chain API.
 */
export class AuthManager {
  private state: AuthState = {
    apiKey: null,
    sessionToken: null,
    userId: null,
    expiresAt: null,
  }

  private refreshTimer: NodeJS.Timeout | null = null
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.loadFromStorage()
  }

  /**
   * Loads authentication state from localStorage.
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    const apiKey = localStorage.getItem('api_key')
    const sessionToken = localStorage.getItem('session_token')
    const userId = localStorage.getItem('user_id')
    const expiresAt = localStorage.getItem('token_expires_at')

    this.state = {
      apiKey,
      sessionToken,
      userId,
      expiresAt: expiresAt ? parseInt(expiresAt, 10) : null,
    }

    // Check if token is expired
    if (this.state.expiresAt && Date.now() >= this.state.expiresAt) {
      this.clearAuth()
    } else if (this.state.sessionToken) {
      this.scheduleTokenRefresh()
    }
  }

  /**
   * Saves authentication state to localStorage.
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    if (this.state.apiKey) {
      localStorage.setItem('api_key', this.state.apiKey)
    }
    if (this.state.sessionToken) {
      localStorage.setItem('session_token', this.state.sessionToken)
    }
    if (this.state.userId) {
      localStorage.setItem('user_id', this.state.userId)
    }
    if (this.state.expiresAt) {
      localStorage.setItem('token_expires_at', this.state.expiresAt.toString())
    }
  }

  /**
   * Logs in with API key and obtains session token.
   *
   * @param apiKey - Base64-encoded API key
   * @returns Login response with session token
   */
  async login(apiKey: string): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/api/account/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ api_key: apiKey }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    const loginData: LoginResponse = await response.json()

    // Store both API key and session token
    this.state = {
      apiKey,
      sessionToken: loginData.session_token,
      userId: loginData.account_id,
      expiresAt: Date.now() + loginData.expires_in * 1000,
    }

    this.saveToStorage()
    this.scheduleTokenRefresh()

    return loginData
  }

  /**
   * Sets API key after account creation (before login).
   */
  setApiKey(apiKey: string): void {
    this.state.apiKey = apiKey
    if (typeof window !== 'undefined') {
      localStorage.setItem('api_key', apiKey)
    }
  }

  /**
   * Logs out and clears authentication state.
   */
  logout(): void {
    this.clearAuth()
  }

  /**
   * Clears authentication state from memory and storage.
   */
  private clearAuth(): void {
    this.state = {
      apiKey: null,
      sessionToken: null,
      userId: null,
      expiresAt: null,
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('api_key')
      localStorage.removeItem('session_token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('token_expires_at')
    }
  }

  /**
   * Schedules automatic token refresh before expiry.
   */
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    if (!this.state.expiresAt) return

    // Refresh 5 minutes before expiry
    const refreshTime = this.state.expiresAt - Date.now() - 5 * 60 * 1000

    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch((error) => {
          console.error('Token refresh failed:', error)
          this.clearAuth()
        })
      }, refreshTime)
    }
  }

  /**
   * Refreshes the session token using the stored API key.
   */
  private async refreshToken(): Promise<void> {
    if (!this.state.apiKey) {
      throw new Error('Cannot refresh token: No API key available')
    }

    await this.login(this.state.apiKey)
  }

  /**
   * Returns the appropriate Authorization header for a given endpoint.
   *
   * API Key: Used for /data/submit (encryption operations)
   * Session Token: Used for all other authenticated endpoints
   *
   * @param endpoint - API endpoint path
   * @returns Authorization header value or null if not authenticated
   */
  getAuthHeader(endpoint: string): string | null {
    // Data submission requires the actual API key (for encryption)
    if (endpoint.includes('/data/submit')) {
      return this.state.apiKey ? `Bearer ${this.state.apiKey}` : null
    }

    // All other endpoints use session token
    return this.state.sessionToken ? `Bearer ${this.state.sessionToken}` : null
  }

  /**
   * Gets the stored API key (for client-side encryption).
   */
  getApiKey(): string | null {
    return this.state.apiKey
  }

  /**
   * Gets the current session token.
   */
  getSessionToken(): string | null {
    return this.state.sessionToken
  }

  /**
   * Gets the user ID.
   */
  getUserId(): string | null {
    return this.state.userId
  }

  /**
   * Checks if user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!(
      this.state.sessionToken &&
      this.state.expiresAt &&
      Date.now() < this.state.expiresAt
    )
  }

  /**
   * Gets the current authentication state.
   */
  getState(): Readonly<AuthState> {
    return { ...this.state }
  }
}
