import { useState } from 'react'
import type { AuditLogEntry } from '@goudchain/types'
import { AuditEventBadge, type AuditEventType } from '../atoms/AuditEventBadge'
import { visuallyHidden } from '../utils/a11y'

export interface RealTimeAuditStreamProps {
  events: AuditLogEntry[]
}

export function RealTimeAuditStream({ events }: RealTimeAuditStreamProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [pausedEvents, setPausedEvents] = useState<AuditLogEntry[]>([])

  const formatTimestamp = (timestamp: number) => {
    // Handle both Unix timestamps (seconds) and JavaScript timestamps (milliseconds)
    const isMilliseconds = timestamp > 10000000000 // Timestamps after year 2286 are in milliseconds
    const date = new Date(isMilliseconds ? timestamp : timestamp * 1000)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  const handleClearStream = () => {
    setPausedEvents([])
  }

  const handleTogglePause = () => {
    if (!isPaused) {
      // Pausing - capture current events
      setPausedEvents(events)
    }
    setIsPaused(!isPaused)
  }

  // Use paused snapshot when paused, otherwise use live events
  const displayEvents = isPaused ? pausedEvents : events

  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
      {/* ARIA live region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={visuallyHidden}
      >
        {displayEvents.length > 0 &&
          `${displayEvents.length} audit events displayed`}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            Real-Time Audit Stream
          </h3>
          <p className="text-sm text-zinc-400">Last 50 events (live updates)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTogglePause}
            className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
              isPaused
                ? 'bg-green-950/50 text-green-400 border-green-800/50 hover:bg-green-900/50'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
            }`}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={handleClearStream}
            className="px-3 py-1.5 rounded text-sm font-medium bg-zinc-900 text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {isPaused && (
        <div className="mb-4 p-3 bg-yellow-950/20 border border-yellow-800/50 rounded text-sm text-yellow-400">
          Stream paused. Click Resume to continue receiving events.
        </div>
      )}

      {displayEvents.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          {isPaused
            ? 'Stream paused. No new events will appear.'
            : 'Waiting for audit events...'}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayEvents.map((event, index) => (
            <div
              key={`${event.timestamp}-${index}`}
              className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800 hover:border-zinc-700 transition-all animate-fade-in"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <AuditEventBadge
                      eventType={event.event_type as AuditEventType}
                    />
                    <span className="text-xs text-zinc-500 font-mono">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-300 truncate">
                    {event.event_id}
                  </div>
                </div>
                <div className="flex-shrink-0 text-xs text-zinc-500 font-mono">
                  {event.ip_address_hash.substring(0, 8)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
