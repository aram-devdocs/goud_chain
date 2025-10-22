import { useState } from 'react'
import type { AuditLogEntry } from '@goudchain/types'
import { AuditEventBadge, type AuditEventType } from '../atoms/AuditEventBadge'

export interface HistoricalAuditTableProps {
  events: AuditLogEntry[]
  isLoading?: boolean
  onApplyFilters: (filters: AuditFilters) => void
  onExportCSV: () => void
}

export interface AuditFilters {
  eventType: AuditEventType | 'all'
  startTs?: number
  endTs?: number
}

export function HistoricalAuditTable({
  events,
  isLoading,
  onApplyFilters,
  onExportCSV,
}: HistoricalAuditTableProps) {
  // Default to today's date
  const today = new Date().toISOString().split('T')[0]

  const [eventTypeFilter, setEventTypeFilter] = useState<
    AuditEventType | 'all'
  >('all')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const formatDateForInput = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toISOString().split('T')[0]
  }

  const handleApplyFilters = () => {
    const filters: AuditFilters = {
      eventType: eventTypeFilter,
    }

    if (startDate) {
      filters.startTs = new Date(startDate).getTime()
    }
    if (endDate) {
      // Set end date to end of day (23:59:59)
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      filters.endTs = endDateTime.getTime()
    }

    onApplyFilters(filters)
  }

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Event Type',
      'IP Hash',
      'Collection ID',
      'Invalidated',
    ]
    const rows = events.map((event) => [
      formatTimestamp(event.timestamp),
      event.event_type,
      event.ip_hash ?? 'N/A',
      event.collection_id ?? 'N/A',
      event.invalidated.toString(),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)

    onExportCSV()
  }

  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-4">
          Historical Audit Logs
        </h3>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Event Type
            </label>
            <select
              value={eventTypeFilter}
              onChange={(e) =>
                setEventTypeFilter(e.target.value as AuditEventType | 'all')
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white transition-colors"
            >
              <option value="all">All Events</option>
              <option value="AccountCreated">Account Created</option>
              <option value="Login">Login</option>
              <option value="DataSubmit">Data Submit</option>
              <option value="DataListed">Data Listed</option>
              <option value="DataDecrypt">Data Decrypt</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Start Date
            </label>
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

          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="flex-1 bg-blue-950/50 text-blue-400 border border-blue-800/50 hover:bg-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              {isLoading ? 'Loading...' : 'Apply Filters'}
            </button>
            <button
              onClick={handleExportCSV}
              disabled={events.length === 0}
              className="px-4 py-2 bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">
          Loading audit logs...
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          No audit logs found. Try adjusting your filters.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                    Timestamp
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                    Event Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                    IP Hash
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                    Collection ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, index) => (
                  <tr
                    key={`${event.timestamp}-${index}`}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-zinc-300 font-mono">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="py-3 px-4">
                      <AuditEventBadge
                        eventType={event.event_type as AuditEventType}
                      />
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-400 font-mono">
                      {event.ip_hash?.substring(0, 16) ?? 'N/A'}...
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-300 truncate max-w-md">
                      {event.collection_id?.substring(0, 16) ?? 'N/A'}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {events.map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <AuditEventBadge
                    eventType={event.event_type as AuditEventType}
                  />
                  <span className="text-xs text-zinc-500 font-mono">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <div className="text-sm text-zinc-300 mb-2">
                  {event.collection_id?.substring(0, 16) ?? 'N/A'}...
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                  IP: {event.ip_hash?.substring(0, 16) ?? 'N/A'}...
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Info */}
          <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              Showing {events.length} {events.length === 1 ? 'event' : 'events'}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
