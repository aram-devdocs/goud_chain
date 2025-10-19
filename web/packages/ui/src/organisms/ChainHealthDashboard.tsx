import { type Block } from '@goudchain/types'
import { useState } from 'react'

export interface ChainHealth {
  isValid: boolean
  score: number // 0-100
  lastValidated: number | null
  checks: {
    hashChainValid: boolean
    merkleRootsValid: boolean
    signaturesValid: boolean
    timestampsMonotonic: boolean
  }
  issues: string[]
}

export interface ChainHealthDashboardProps {
  blocks: Block[]
  health: ChainHealth | null
  isValidating: boolean
  onValidate: () => void
  actualCollectionCount?: number
  validationProgress?: { current: number; total: number; step: string }
}

function formatNumber(num: number): string {
  return num.toLocaleString()
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function ChainHealthDashboard({
  blocks,
  health,
  isValidating,
  onValidate,
  actualCollectionCount,
  validationProgress,
}: ChainHealthDashboardProps) {
  // Calculate stats
  const totalBlocks = blocks.length
  const totalCollections = actualCollectionCount ?? blocks.reduce((sum, block) => sum + (block.data_count || 0), 0)
  const uniqueValidators = new Set(blocks.map((b) => b.validator)).size

  // Calculate average block time (exclude old genesis blocks >24h old)
  let avgBlockTime = 0
  if (blocks.length > 1) {
    const now = Math.floor(Date.now() / 1000)
    const recentBlocks = blocks.filter(b => (now - b.timestamp) < 86400) // Last 24 hours

    if (recentBlocks.length > 1) {
      let totalTime = 0
      for (let i = 1; i < recentBlocks.length; i++) {
        totalTime += recentBlocks[i]!.timestamp - recentBlocks[i - 1]!.timestamp
      }
      avgBlockTime = Math.round(totalTime / (recentBlocks.length - 1))
    }
  }

  // Get latest block age
  const latestBlockAge = blocks.length > 0
    ? formatRelativeTime(blocks[blocks.length - 1]!.timestamp * 1000)
    : 'N/A'

  // Calculate chain size (more accurate estimation)
  const chainSizeBytes = totalBlocks * 2500 // ~2.5KB per block
  const chainSizeDisplay = chainSizeBytes < 1024
    ? `${chainSizeBytes}B`
    : `${Math.round(chainSizeBytes / 1024)}KB`

  // State for expanded health check explanations
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null)

  // Health check explanations
  const checkExplanations = {
    hashChainValid: {
      title: 'Hash Chain Integrity',
      description: 'Each block contains the hash of the previous block, creating an immutable chain. If any block is tampered with, all subsequent hashes become invalid.',
      howItWorks: 'Validates that each block\'s previous_hash matches the actual hash of the preceding block.',
    },
    merkleRootsValid: {
      title: 'Merkle Root Verification',
      description: 'Merkle roots are cryptographic fingerprints of all data in a block. They allow efficient verification that data hasn\'t been altered.',
      howItWorks: 'Recalculates the Merkle tree from block data and confirms it matches the stored merkle_root.',
    },
    signaturesValid: {
      title: 'Digital Signatures',
      description: 'Each block is signed by its validator using their private key. This proves authenticity and prevents unauthorized block creation.',
      howItWorks: 'Verifies each block\'s signature using the validator\'s public key with Ed25519 cryptography.',
    },
    timestampsMonotonic: {
      title: 'Timestamp Ordering',
      description: 'Block timestamps must always increase. This prevents time-travel attacks where malicious actors try to reorder the chain.',
      howItWorks: 'Checks that each block\'s timestamp is greater than or equal to the previous block\'s timestamp.',
    },
  }

  // Health score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-900/20 border-green-700'
    if (score >= 70) return 'bg-yellow-900/20 border-yellow-700'
    return 'bg-red-900/20 border-red-700'
  }

  const toggleCheckExpansion = (checkKey: string) => {
    setExpandedCheck(expandedCheck === checkKey ? null : checkKey)
  }

  return (
    <div className="space-y-6">
      {/* Health Score Card */}
      <div className={`rounded-lg p-6 border ${health ? getScoreBg(health.score) : 'bg-zinc-900/20 border-zinc-700'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Chain Health</h3>
            <p className="text-xs text-zinc-400">
              {health?.lastValidated
                ? `Last validated ${formatRelativeTime(health.lastValidated)}`
                : 'Not validated yet'}
            </p>
          </div>
          <button
            onClick={onValidate}
            disabled={isValidating}
            className="bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? 'Validating...' : 'Validate Now'}
          </button>
        </div>

        {/* Validation Progress */}
        {isValidating && validationProgress && validationProgress.total > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-400">{validationProgress.step}</span>
              <span className="text-xs text-zinc-400">
                {validationProgress.current} / {validationProgress.total}
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${(validationProgress.current / validationProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {health && (
          <>
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <div className={`text-4xl font-bold ${getScoreColor(health.score)}`}>
                  {health.score}
                </div>
                <div className="text-zinc-400">/100</div>
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {health.isValid ? 'Chain integrity verified' : 'Issues detected'}
              </div>
            </div>

            {/* Overall Status Message */}
            <div className="mb-4 p-3 bg-zinc-800/50 border border-zinc-700 rounded">
              <p className="text-sm text-zinc-300">
                {health.isValid
                  ? '✓ Your blockchain is secure and tamper-proof. All cryptographic integrity checks passed.'
                  : '⚠ Integrity issues detected. Review the checks below for details.'}
              </p>
            </div>

            {/* Integrity Checks with Expandable Explanations */}
            <div className="space-y-2">
              {(Object.keys(health.checks) as Array<keyof typeof health.checks>).map((checkKey) => {
                const isValid = health.checks[checkKey]
                const explanation = checkExplanations[checkKey]
                const isExpanded = expandedCheck === checkKey

                return (
                  <div key={checkKey} className="border border-zinc-800 rounded overflow-hidden">
                    <button
                      onClick={() => toggleCheckExpansion(checkKey)}
                      className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={isValid ? 'text-green-400 text-lg' : 'text-red-400 text-lg'}>
                          {isValid ? '✓' : '✗'}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-white">{explanation.title}</div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            {isValid ? 'Passed' : 'Failed'} • Click to learn more
                          </div>
                        </div>
                      </div>
                      <span className="text-zinc-500 text-xs">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 bg-zinc-900/50 border-t border-zinc-800">
                        <div className="space-y-2 text-xs">
                          <div>
                            <div className="text-zinc-400 font-medium mb-1">What it is:</div>
                            <div className="text-zinc-300">{explanation.description}</div>
                          </div>
                          <div>
                            <div className="text-zinc-400 font-medium mb-1">How it works:</div>
                            <div className="text-zinc-300">{explanation.howItWorks}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Issues */}
            {health.issues.length > 0 && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded">
                <div className="text-xs font-bold text-red-400 mb-1">Issues Detected:</div>
                <ul className="text-xs text-red-300 space-y-1">
                  {health.issues.map((issue, i) => (
                    <li key={i}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 rounded-lg p-4 border border-blue-800/50">
          <div className="text-xs text-blue-300 mb-1">Total Blocks</div>
          <div className="text-2xl font-bold text-blue-400">{formatNumber(totalBlocks)}</div>
        </div>

        <div className="bg-gradient-to-br from-green-950/50 to-green-900/30 rounded-lg p-4 border border-green-800/50">
          <div className="text-xs text-green-300 mb-1">Collections</div>
          <div className="text-2xl font-bold text-green-400">{formatNumber(totalCollections)}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 rounded-lg p-4 border border-purple-800/50">
          <div className="text-xs text-purple-300 mb-1">Validators</div>
          <div className="text-2xl font-bold text-purple-400">{formatNumber(uniqueValidators)}</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-950/50 to-yellow-900/30 rounded-lg p-4 border border-yellow-800/50">
          <div className="text-xs text-yellow-300 mb-1">Avg Block Time</div>
          <div className="text-2xl font-bold text-yellow-400">{avgBlockTime}s</div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
          <div className="text-xs text-zinc-300 mb-1">Latest Block</div>
          <div className="text-2xl font-bold text-white">{latestBlockAge}</div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
          <div className="text-xs text-zinc-300 mb-1">Chain Size</div>
          <div className="text-2xl font-bold text-white">{chainSizeDisplay}</div>
        </div>
      </div>
    </div>
  )
}
