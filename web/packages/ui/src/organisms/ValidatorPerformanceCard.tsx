export interface ValidatorStat {
  validator: string
  blockCount: number
  percentage: number
  isCurrentValidator: boolean
}

export interface ValidatorPerformanceCardProps {
  validators: ValidatorStat[]
  totalBlocks: number
}

export function ValidatorPerformanceCard({ validators, totalBlocks }: ValidatorPerformanceCardProps) {
  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
      <h3 className="text-lg font-bold text-white mb-4">Validator Performance</h3>

      <div className="space-y-4">
        {validators.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            No validator data available
          </div>
        ) : (
          validators.map((validator, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-white">{validator.validator}</span>
                  {validator.isCurrentValidator && (
                    <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-400">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono text-white mr-2">{validator.blockCount}</span>
                  <span className="text-xs text-zinc-400">{validator.percentage.toFixed(1)}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${
                    validator.isCurrentValidator
                      ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                      : 'bg-gradient-to-r from-purple-500 to-purple-400'
                  }`}
                  style={{ width: `${validator.percentage}%` }}
                />
              </div>
            </div>
          ))
        )}

        {/* Summary */}
        {validators.length > 0 && (
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Total Blocks: {totalBlocks}</span>
            <span>{validators.length} Validators</span>
          </div>
        )}
      </div>
    </div>
  )
}
