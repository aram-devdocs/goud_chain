import { useQuery } from '@tanstack/react-query'
import type { AuditLogsResponse } from '@goudchain/types'
import { handleApiError, safeJsonParse } from './apiErrorHandler'
import { API_BASE } from '../config'

export interface AuditLogsParams {
  event_type?: string
  start_timestamp?: number
  end_timestamp?: number
  page?: number
  page_size?: number
}

export function useAuditLogs(params: AuditLogsParams = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const token = localStorage.getItem('session_token')
      if (!token) {
        throw new Error('No session token found')
      }

      const queryParams = new URLSearchParams()
      if (params.event_type) queryParams.set('event_type', params.event_type)
      if (params.start_timestamp)
        queryParams.set('start_timestamp', params.start_timestamp.toString())
      if (params.end_timestamp)
        queryParams.set('end_timestamp', params.end_timestamp.toString())
      if (params.page) queryParams.set('page', params.page.toString())
      if (params.page_size)
        queryParams.set('page_size', params.page_size.toString())

      const url = `${API_BASE}/api/audit${queryParams.toString() ? `?${queryParams}` : ''}`
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        await handleApiError(response)
      }

      return safeJsonParse<AuditLogsResponse>(response)
    },
  })
}
