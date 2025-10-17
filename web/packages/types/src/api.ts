export interface ApiError {
  error: string
  details?: string
}

export interface CreateAccountRequest {
  username: string
}

export interface CreateAccountResponse {
  api_key: string
  user_id: string
}

export interface LoginRequest {
  api_key: string
}

export interface LoginResponse {
  session_token: string
  user_id: string
  expires_at: number
}

export interface SubmitDataRequest {
  collection_id: string
  encrypted_data: string
}

export interface SubmitDataResponse {
  message: string
  data_id: string
}

export interface ListCollectionsResponse {
  collections: Array<{
    collection_id: string
    user_id: string
    blind_index: string
    created_at: number
    data_count: number
  }>
}

export interface DecryptDataResponse {
  data_id: string
  collection_id: string
  encrypted_data: string
  created_at: number
}

export interface AuditLogEntry {
  event_id: string
  user_id: string
  event_type: string
  ip_address_hash: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[]
  total: number
}

export interface MetricsResponse {
  chain: {
    length: number
    latest_block_number: number
    latest_block_timestamp: number
  }
  network: {
    peer_count: number
  }
  performance: {
    cache_hit_rate: number
    operations_total: number
  }
}
