export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString()
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp * 1000
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  if (seconds > 0) return `${seconds}s ago`
  return 'just now'
}

export function formatHash(hash: string, length: number = 8): string {
  if (hash.length <= length) return hash
  return `${hash.slice(0, length / 2)}...${hash.slice(-length / 2)}`
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round(bytes / Math.pow(k, i) * 100) / 100} ${sizes[i]}`
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}
