import { useState, useEffect } from 'react'
import { useAuditLogs } from '@goudchain/hooks'
import { useWebSocketContext } from '../contexts/WebSocketContext'
import {
  Stack,
  RealTimeAuditStream,
  HistoricalAuditTable,
  type AuditFilters,
} from '@goudchain/ui'
import type { AuditLogEntry } from '@goudchain/types'

type Mode = 'live' | 'query'

export default function AuditPage() {
  const [mode, setMode] = useState<Mode>('live')
  const [liveEvents, setLiveEvents] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('audit_live_events')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    localStorage.setItem('audit_live_events', JSON.stringify(liveEvents))
  }, [liveEvents])

  const today = new Date().toISOString().split('T')[0]
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [page, setPage] = useState(0)
  const [queryEnabled, setQueryEnabled] = useState(false)

  const { lastMessage } = useWebSocketContext()

  useEffect(() => {
    if (mode !== 'live' || isPaused || !lastMessage) return

    const message = lastMessage as unknown as {
      type: string
      event?: string
      event_type?: string
      timestamp?: number
      collection_id?: string
      metadata?: any
    }

    if (message.type === 'event' && message.event === 'audit_log_update') {
      const auditEntry: AuditLogEntry = {
        event_type: message.event_type || 'Unknown',
        timestamp: message.timestamp || Date.now(),
        collection_id: message.collection_id,
        ip_hash: message.metadata?.ip_hash || '(pending)',
        metadata: message.metadata || {},
        invalidated: false,
      }

      setLiveEvents((prev) => [auditEntry, ...prev].slice(0, 100))
    }
  }, [lastMessage, mode, isPaused])

  const queryParams = {
    event_type: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
    start_ts: startDate ? new Date(startDate).getTime() : undefined,
    end_ts: endDate
      ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1)
      : undefined,
    page,
    page_size: 50,
  }

  const {
    data: queryData,
    isLoading,
    refetch,
  } = useAuditLogs(queryParams, queryEnabled)

  const handleExportCSV = () => {
    const events = mode === 'live' ? liveEvents : queryData?.logs || []
    if (events.length === 0) {
      alert('No audit logs to export')
      return
    }

    const csv = [
      ['Timestamp', 'Event Type', 'IP Hash', 'Collection ID', 'Invalidated'],
      ...events.map((event) => [
        new Date(event.timestamp).toISOString(),
        event.event_type,
        event.ip_hash,
        event.collection_id || '',
        event.invalidated.toString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleApplyQueryFilters = (filters: AuditFilters) => {
    setEventTypeFilter(filters.eventType === 'all' ? 'all' : filters.eventType)
    if (filters.startTs) {
      setStartDate(
        new Date(filters.startTs * 1000).toISOString().split('T')[0]!
      )
    }
    if (filters.endTs) {
      setEndDate(new Date(filters.endTs * 1000).toISOString().split('T')[0]!)
    }
    setQueryEnabled(true)
    setPage(0)
    setTimeout(() => refetch(), 0)
  }

  return (
    <Stack direction="vertical" spacing={6}>
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Audit Logs</h2>
        <p className="text-zinc-500">Security audit trail and activity logs</p>
      </div>

      <div className="flex gap-2 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setMode('live')}
          type="button"
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
            mode === 'live'
              ? 'bg-blue-950/50 text-blue-400 border border-blue-800/50'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
          }`}
        >
          Live Mode
        </button>
        <button
          onClick={() => setMode('query')}
          type="button"
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
            mode === 'query'
              ? 'bg-blue-950/50 text-blue-400 border border-blue-800/50'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
          }`}
        >
          Query Mode
        </button>
      </div>

      {mode === 'live' && <RealTimeAuditStream events={liveEvents} />}

      {mode === 'query' && (
        <HistoricalAuditTable
          events={queryData?.logs || []}
          isLoading={isLoading}
          onApplyFilters={handleApplyQueryFilters}
          onExportCSV={handleExportCSV}
        />
      )}
    </Stack>
  )
}
