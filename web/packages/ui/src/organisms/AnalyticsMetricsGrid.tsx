export interface MetricData {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
  }
  color: 'blue' | 'green' | 'purple' | 'yellow'
}

export interface AnalyticsMetricsGridProps {
  metrics: MetricData[]
}

export function AnalyticsMetricsGrid({ metrics }: AnalyticsMetricsGridProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-950/50 to-blue-900/30 border-blue-800/50 text-blue-300'
      case 'green':
        return 'from-green-950/50 to-green-900/30 border-green-800/50 text-green-300'
      case 'purple':
        return 'from-purple-950/50 to-purple-900/30 border-purple-800/50 text-purple-300'
      case 'yellow':
        return 'from-yellow-950/50 to-yellow-900/30 border-yellow-800/50 text-yellow-300'
      default:
        return 'from-zinc-900/50 to-zinc-800/30 border-zinc-700/50 text-zinc-300'
    }
  }

  const getValueColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-blue-400'
      case 'green':
        return 'text-green-400'
      case 'purple':
        return 'text-purple-400'
      case 'yellow':
        return 'text-yellow-400'
      default:
        return 'text-white'
    }
  }

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      default:
        return '→'
    }
  }

  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      default:
        return 'text-zinc-400'
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br rounded-lg p-4 border ${getColorClasses(metric.color)}`}
        >
          <div className="text-xs mb-1">{metric.label}</div>
          <div className={`text-2xl font-bold ${getValueColor(metric.color)} mb-1`}>
            {metric.value}
          </div>
          {metric.trend && (
            <div className={`text-xs ${getTrendColor(metric.trend.direction)}`}>
              {getTrendIcon(metric.trend.direction)} {metric.trend.value}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
