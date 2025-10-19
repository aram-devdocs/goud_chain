export interface BlockCreationDataPoint {
  hour: string
  count: number
}

export interface BlockCreationChartProps {
  data: BlockCreationDataPoint[]
  title?: string
}

export function BlockCreationChart({
  data,
  title = 'Block Creation Timeline',
}: BlockCreationChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
      <h3 className="text-lg font-bold text-white mb-4">{title}</h3>

      {data.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          No block creation data available
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chart */}
          <div className="flex items-end justify-between gap-2 h-48">
            {data.map((point, index) => {
              const height = (point.count / maxCount) * 100

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full flex items-end justify-center"
                    style={{ height: '100%' }}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-400 hover:to-blue-300 cursor-pointer relative group"
                      style={{
                        height: `${height}%`,
                        minHeight: point.count > 0 ? '4px' : '0',
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-zinc-700 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {point.count} blocks
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between gap-2 text-xs text-zinc-500">
            {data.map((point, index) => {
              // Show every other label on small screens
              const showLabel = index % 2 === 0 || data.length <= 12

              return (
                <div
                  key={index}
                  className={`flex-1 text-center ${!showLabel ? 'hidden sm:block' : ''}`}
                >
                  {point.hour}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-400">
              Total: {data.reduce((sum, d) => sum + d.count, 0)} blocks
            </div>
            <div className="text-xs text-zinc-400">
              Peak: {maxCount} blocks/hour
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
