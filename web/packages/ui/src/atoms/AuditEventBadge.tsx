export type AuditEventType =
  | 'AccountCreated'
  | 'Login'
  | 'DataSubmit'
  | 'DataListed'
  | 'DataDecrypt'

export interface AuditEventBadgeProps {
  eventType: AuditEventType
}

export function AuditEventBadge({ eventType }: AuditEventBadgeProps) {
  const getEventColor = (type: AuditEventType) => {
    switch (type) {
      case 'AccountCreated':
        return 'bg-green-950/50 text-green-400 border-green-800/50'
      case 'Login':
        return 'bg-blue-950/50 text-blue-400 border-blue-800/50'
      case 'DataSubmit':
        return 'bg-purple-950/50 text-purple-400 border-purple-800/50'
      case 'DataListed':
        return 'bg-cyan-950/50 text-cyan-400 border-cyan-800/50'
      case 'DataDecrypt':
        return 'bg-orange-950/50 text-orange-400 border-orange-800/50'
      default:
        return 'bg-zinc-900 text-zinc-400 border-zinc-700'
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getEventColor(eventType)}`}
    >
      {eventType}
    </span>
  )
}
