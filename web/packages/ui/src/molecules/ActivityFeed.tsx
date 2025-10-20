/**
 * ActivityFeed Component
 *
 * Display a feed of activity events with icons, colors, and timestamps
 */

import { clsx } from 'clsx'
import { formatRelativeTime } from '@goudchain/utils'
import { Card, CardHeader, CardTitle, CardContent } from './Card'

export type ActivityEventType =
  | 'blockchain'
  | 'collection'
  | 'peer'
  | 'audit'
  | 'metrics'

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  message: string
  timestamp: number
}

export interface ActivityFeedProps {
  /** Array of activity events */
  activities: ActivityEvent[]
  /** Callback when clear button is clicked */
  onClear?: () => void
  /** Maximum height for scrollable area (default: 400px) */
  maxHeight?: string
  /** Maximum number of activities to display (default: 10) */
  maxItems?: number
}

const getActivityIcon = (type: ActivityEventType): string => {
  switch (type) {
    case 'blockchain':
      return 'BLOCK'
    case 'collection':
      return 'DATA'
    case 'peer':
      return 'PEER'
    case 'audit':
      return 'AUDIT'
    case 'metrics':
      return 'STATS'
    default:
      return 'INFO'
  }
}

const getActivityColor = (type: ActivityEventType): string => {
  switch (type) {
    case 'blockchain':
      return 'bg-blue-500/20 text-blue-400'
    case 'collection':
      return 'bg-green-500/20 text-green-400'
    case 'peer':
      return 'bg-purple-500/20 text-purple-400'
    case 'audit':
      return 'bg-yellow-500/20 text-yellow-400'
    case 'metrics':
      return 'bg-zinc-500/20 text-zinc-400'
    default:
      return 'bg-blue-500/20 text-blue-400'
  }
}

export function ActivityFeed({
  activities,
  onClear,
  maxHeight = '400px',
  maxItems = 10,
}: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-zinc-900/50 px-6 py-4 border-b border-zinc-800 flex flex-row items-center justify-between mb-0">
        <CardTitle>Recent Activity</CardTitle>
        {activities.length > 0 && onClear && (
          <button
            onClick={onClear}
            className="text-xs text-zinc-400 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1"
            type="button"
            aria-label="Clear activity feed"
            tabIndex={0}
          >
            Clear
          </button>
        )}
      </CardHeader>

      <div
        className="divide-y divide-zinc-800"
        style={{ maxHeight, overflowY: 'auto' }}
      >
        {displayedActivities.map((activity) => (
          <div
            key={activity.id}
            className="px-6 py-3 hover:bg-zinc-900/50 transition"
          >
            <div className="flex items-start gap-3">
              <div
                className={clsx(
                  'text-xs font-mono font-bold px-2 py-1 rounded',
                  getActivityColor(activity.type)
                )}
              >
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{activity.message}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="px-6 py-12 text-center text-zinc-500">
            <p>No recent activity</p>
            <p className="text-xs mt-1">
              Events will appear here as they happen
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
