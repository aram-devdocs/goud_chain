import { useState, useEffect } from 'react'
import { useAuditLogs, API_BASE } from '@goudchain/hooks'
import { useWebSocketContext } from '../contexts/WebSocketContext'
import type { AuditLogEntry } from '@goudchain/types'

type Mode = 'live' | 'query'

export default function AuditPage() {
  const [mode, setMode] = useState<Mode>('live')
  // Persist live events in localStorage
  const [liveEvents, setLiveEvents] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('audit_live_events')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })
  const [isPaused, setIsPaused] = useState(false)

  // Save live events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('audit_live_events', JSON.stringify(liveEvents))
  }, [liveEvents])

  // Query mode state
  const today = new Date().toISOString().split('T')[0]
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [page, setPage] = useState(0)
  const [queryEnabled, setQueryEnabled] = useState(false)

  // WebSocket for live mode
  const { lastMessage } = useWebSocketContext()

  // Listen for audit events in live mode
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
        event_id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        user_id: message.metadata?.user_id || 'WebSocket Event',
        event_type: message.event_type || 'Unknown',
        ip_address_hash: message.metadata?.ip_address_hash || '(pending)',
        timestamp: message.timestamp || Math.floor(Date.now() / 1000),
        metadata: message.metadata,
      }

      setLiveEvents((prev) => [auditEntry, ...prev].slice(0, 100))
    }
  }, [lastMessage, mode, isPaused])

  // Query mode data
  const queryParams = {
    event_type: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
    start_ts: startDate ? new Date(startDate).getTime() : undefined,
    end_ts: endDate
      ? new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1)
      : undefined,
    page,
    page_size: 50,
  }

  const { data: queryData, isLoading, refetch } = useAuditLogs(queryParams, queryEnabled)

  const handleApplyFilters = () => {
    setQueryEnabled(true)
    setPage(0)
    setTimeout(() => refetch(), 0)
  }

  const handleExportCSV = () => {
    const events = mode === 'live' ? liveEvents : queryData?.logs || []
    if (events.length === 0) {
      alert('No audit logs to export')
      return
    }

    const csv = [
      ['Timestamp', 'Event Type', 'IP Hash', 'Event ID', 'User ID'],
      ...events.map((event) => [
        new Date(event.timestamp * 1000).toISOString(),
        event.event_type,
        event.ip_address_hash,
        event.event_id,
        event.user_id,
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

  const formatTimestamp = (timestamp: number) => {
    // Handle both Unix timestamps (seconds) and JavaScript timestamps (milliseconds)
    const isMilliseconds = timestamp > 10000000000
    const date = new Date(isMilliseconds ? timestamp : timestamp * 1000)
    return date.toLocaleString()
  }

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'AccountCreated':
        return 'bg-green-900/20 border-green-700 text-green-400'
      case 'AccountLogin':
        return 'bg-blue-900/20 border-blue-700 text-blue-400'
      case 'DataSubmitted':
        return 'bg-purple-900/20 border-purple-700 text-purple-400'
      case 'DataDecrypted':
        return 'bg-yellow-900/20 border-yellow-700 text-yellow-400'
      case 'DataListed':
        return 'bg-zinc-900/20 border-zinc-700 text-zinc-400'
      default:
        return 'bg-zinc-900/20 border-zinc-700 text-zinc-400'
    }
  }

  const eventsToDisplay = mode === 'live' ? liveEvents : queryData?.logs || []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Audit Logs</h2>
        <p className="text-zinc-500">Security audit trail and activity logs</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setMode('live')}
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
          className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
            mode === 'query'
              ? 'bg-blue-950/50 text-blue-400 border border-blue-800/50'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:bg-zinc-800'
          }`}
        >
          Query Mode
        </button>
      </div>

      {/* Live Mode */}
      {mode === 'live' && (
        <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Real-Time Audit Stream</h3>
              <p className="text-sm text-zinc-400">Last 100 events (live updates)</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                  isPaused
                    ? 'bg-green-950/50 text-green-400 border-green-800/50 hover:bg-green-900/50'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => {
                  setLiveEvents([])
                  localStorage.removeItem('audit_live_events')
                }}
                className="px-3 py-1.5 rounded text-sm font-medium bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded text-sm font-medium bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>

          {isPaused && (
            <div className="mb-4 p-3 bg-yellow-950/20 border border-yellow-800/50 rounded text-sm text-yellow-400">
              Stream paused. Click Resume to continue receiving events.
            </div>
          )}

          {eventsToDisplay.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              {isPaused ? 'Stream paused. No new events will appear.' : 'Waiting for audit events...'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-zinc-900 border-b border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Timestamp</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Event Type</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">IP Hash</th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-400">Event ID</th>
                  </tr>
                </thead>
                <tbody>
                  {eventsToDisplay.map((event, index) => (
                    <tr
                      key={`${event.timestamp}-${index}`}
                      className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                        {formatTimestamp(event.timestamp)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs border ${getEventTypeColor(event.event_type)}`}>
                          {event.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-zinc-400 text-xs">
                        {event.ip_address_hash.substring(0, 16)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300 truncate max-w-md">
                        {event.event_id.substring(0, 32)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Query Mode */}
      {mode === 'query' && (
        <>
          {/* Filters */}
          <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Event Type</label>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors"
                >
                  <option value="all">All Events</option>
                  <option value="AccountCreated">Account Created</option>
                  <option value="AccountLogin">Login</option>
                  <option value="DataSubmitted">Data Submit</option>
                  <option value="DataListed">Data Listed</option>
                  <option value="DataDecrypted">Data Decrypt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleApplyFilters}
                  disabled={isLoading}
                  className="w-full bg-white text-black px-6 py-2 text-sm hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  {isLoading ? 'Loading...' : 'Apply Filters'}
                </button>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleExportCSV}
                  disabled={eventsToDisplay.length === 0}
                  className="w-full bg-zinc-800 border border-zinc-700 px-6 py-2 text-sm hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed rounded"
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Historical Table */}
          <div className="bg-zinc-950 border border-zinc-800 overflow-hidden rounded-lg">
            {isLoading ? (
              <div className="text-center py-12 text-zinc-500">Loading audit logs...</div>
            ) : eventsToDisplay.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No audit logs found. Try adjusting your filters.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-900 border-b border-zinc-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-zinc-400">Timestamp</th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-400">Event Type</th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-400">IP Hash</th>
                        <th className="px-4 py-3 text-left font-medium text-zinc-400">Event ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventsToDisplay.map((event, index) => (
                        <tr
                          key={`${event.timestamp}-${index}`}
                          className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                        >
                          <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                            {formatTimestamp(event.timestamp)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs border ${getEventTypeColor(event.event_type)}`}>
                              {event.event_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-400 text-xs">
                            {event.ip_address_hash.substring(0, 16)}...
                          </td>
                          <td className="px-4 py-3 text-sm text-zinc-300 truncate max-w-md">
                            {event.event_id.substring(0, 32)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {queryData && (
                  <div className="flex justify-between items-center px-4 py-3 bg-zinc-900 border-t border-zinc-800">
                    <button
                      onClick={() => {
                        setPage(page - 1)
                        refetch()
                      }}
                      disabled={page === 0}
                      className="bg-zinc-800 border border-zinc-700 px-4 py-1.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-zinc-400">
                      Page {page + 1} of {queryData.total_pages || 1} ({queryData.total} total)
                    </span>
                    <button
                      onClick={() => {
                        setPage(page + 1)
                        refetch()
                      }}
                      disabled={page >= (queryData.total_pages || 1) - 1}
                      className="bg-zinc-800 border border-zinc-700 px-4 py-1.5 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
