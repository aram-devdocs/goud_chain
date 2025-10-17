import { useState } from 'react'
import { useAuditLogs } from '@goudchain/hooks'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
} from '@goudchain/ui'
import { formatDate, formatHash } from '@goudchain/utils'
import { SpinnerSize } from '@goudchain/types'

export default function AuditPage() {
  const [limit] = useState(50)
  const { data, isLoading } = useAuditLogs({ limit })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Audit Logs</h2>
        <p className="text-zinc-500">Security audit trail and activity logs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.logs.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No audit logs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                      Event Type
                    </th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                      Timestamp
                    </th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                      IP Hash
                    </th>
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                      Event ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data?.logs.map((log, index) => (
                    <tr
                      key={log.event_id}
                      className={
                        index % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/50'
                      }
                    >
                      <td className="py-3 px-4 font-mono text-white">
                        {log.event_type}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400 text-xs">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400 text-xs">
                        {formatHash(log.ip_address_hash, 12)}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400 text-xs">
                        {formatHash(log.event_id, 8)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
