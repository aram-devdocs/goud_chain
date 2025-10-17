import { useQuery } from '@tanstack/react-query'
import type { AuditLogsResponse } from '@goudchain/types'

interface AuditLogsParams {
  limit?: number
  offset?: number
  event_type?: string
}

export function useAuditLogs(params: AuditLogsParams = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const token = localStorage.getItem('session_token')
      if (!token) throw new Error('Not authenticated')

      const queryParams = new URLSearchParams()
      if (params.limit) queryParams.set('limit', params.limit.toString())
      if (params.offset) queryParams.set('offset', params.offset.toString())
      if (params.event_type) queryParams.set('event_type', params.event_type)

      const url = `/api/audit${queryParams.toString() ? `?${queryParams}` : ''}`
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch audit logs')
      }

      return response.json() as Promise<AuditLogsResponse>
    },
  })
}
