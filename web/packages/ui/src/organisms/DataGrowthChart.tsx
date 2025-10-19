export interface DataGrowthPoint {
  blockIndex: number
  cumulativeData: number
}

export interface DataGrowthChartProps {
  data: DataGrowthPoint[]
  title?: string
}

export function DataGrowthChart({
  data,
  title = 'Data Storage Growth',
}: DataGrowthChartProps) {
  const maxData = Math.max(...data.map((d) => d.cumulativeData), 1)

  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>

      {data.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          No data growth information available
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart - Area style */}
          <div className="relative h-48">
            <svg
              width="100%"
              height="100%"
              className="overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Create area path */}
              <defs>
                <linearGradient
                  id="dataGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="rgb(34, 197, 94)"
                    stopOpacity="0.3"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(34, 197, 94)"
                    stopOpacity="0.05"
                  />
                </linearGradient>
              </defs>

              {data.length > 1 && (
                <>
                  {/* Area fill */}
                  <path
                    d={generateAreaPath(data, maxData)}
                    fill="url(#dataGradient)"
                    className="transition-all"
                  />

                  {/* Line */}
                  <path
                    d={generateLinePath(data, maxData)}
                    fill="none"
                    stroke="rgb(34, 197, 94)"
                    strokeWidth="2"
                    className="transition-all"
                  />
                </>
              )}
            </svg>

            {/* Data points */}
            <div className="absolute inset-0 flex items-end">
              {data.map((point, index) => {
                const leftPercent = (index / (data.length - 1)) * 100
                const heightPercent = (point.cumulativeData / maxData) * 100

                return (
                  <div
                    key={index}
                    className="absolute group"
                    style={{
                      left: `${leftPercent}%`,
                      bottom: `${heightPercent}%`,
                      transform: 'translate(-50%, 50%)',
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400 ring-2 ring-green-950" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-zinc-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Block #{point.blockIndex}: {point.cumulativeData} items
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-400">
              Total Data: {data[data.length - 1]?.cumulativeData ?? 0} items
            </div>
            <div className="text-xs text-zinc-400">
              Across {data.length} blocks
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function generateLinePath(data: DataGrowthPoint[], maxData: number): string {
  if (data.length === 0) return ''

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - (point.cumulativeData / maxData) * 100
    return `${x},${y}`
  })

  return `M ${points.join(' L ')}`
}

function generateAreaPath(data: DataGrowthPoint[], maxData: number): string {
  if (data.length === 0) return ''

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = 100 - (point.cumulativeData / maxData) * 100
    return `${x},${y}`
  })

  // Create area by going to bottom corners
  return `M 0,100 L ${points.join(' L ')} L 100,100 Z`
}
