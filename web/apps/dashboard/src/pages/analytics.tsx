import { useMemo } from 'react'
import {
  useChainInfo,
  useMetrics,
  useListCollections,
  useValidator,
} from '@goudchain/hooks'
import {
  AnalyticsMetricsGrid,
  BlockCreationChart,
  DataGrowthChart,
  CollectionStatsCard,
  ValidatorPerformanceCard,
  RecentActivityTimeline,
  Spinner,
  type MetricData,
  type BlockCreationDataPoint,
  type DataGrowthPoint,
  type CollectionStats,
  type ValidatorStat,
  type ActivityBlock,
} from '@goudchain/ui'
import { SpinnerSize } from '@goudchain/types'

export default function AnalyticsPage() {
  const { data: chainInfo, isLoading: chainLoading } = useChainInfo()
  const { data: metrics, isLoading: metricsLoading } = useMetrics()
  const { data: collectionsData, isLoading: collectionsLoading } =
    useListCollections()
  const { data: validatorInfo, isLoading: validatorLoading } = useValidator()

  const isLoading =
    chainLoading || metricsLoading || collectionsLoading || validatorLoading

  const blocks = chainInfo?.chain ?? []

  // Calculate key metrics with fixed avg block time
  const keyMetrics: MetricData[] = useMemo(() => {
    const totalBlocks = blocks.length
    const totalCollections = collectionsData?.collections.length ?? 0

    // Fix: Calculate avg block time from recent blocks only (last 24h)
    let avgBlockTime = 0
    if (blocks.length > 1) {
      const now = Math.floor(Date.now() / 1000)
      const recentBlocks = blocks.filter((b) => now - b.timestamp < 86400)

      if (recentBlocks.length > 1) {
        let totalTime = 0
        for (let i = 1; i < recentBlocks.length; i++) {
          totalTime +=
            recentBlocks[i]!.timestamp - recentBlocks[i - 1]!.timestamp
        }
        avgBlockTime = Math.round(totalTime / (recentBlocks.length - 1))
      }
    }

    const cacheHitRate = (metrics?.performance?.cache_hit_rate ?? 0) * 100

    return [
      {
        label: 'Total Blocks',
        value: totalBlocks,
        color: 'blue' as const,
      },
      {
        label: 'Total Collections',
        value: totalCollections,
        color: 'green' as const,
      },
      {
        label: 'Avg Block Time',
        value: avgBlockTime > 0 ? `${avgBlockTime}s` : 'N/A',
        color: 'yellow' as const,
      },
      {
        label: 'Cache Hit Rate',
        value: `${cacheHitRate.toFixed(1)}%`,
        color: 'purple' as const,
      },
    ]
  }, [blocks, collectionsData, metrics])

  // Prepare block creation timeline data (group by hour for last 24 hours)
  const blockCreationData: BlockCreationDataPoint[] = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    const hoursAgo = 24
    const hourlyBuckets: { [key: string]: number } = {}

    // Initialize buckets for last 24 hours
    for (let i = hoursAgo - 1; i >= 0; i--) {
      const hourTimestamp = now - i * 3600
      const hourLabel = new Date(hourTimestamp * 1000).toLocaleTimeString(
        'en-US',
        {
          hour: 'numeric',
          hour12: false,
        }
      )
      hourlyBuckets[hourLabel] = 0
    }

    // Count blocks in each hour
    blocks.forEach((block) => {
      const blockAge = now - block.timestamp
      if (blockAge < hoursAgo * 3600) {
        const hourLabel = new Date(block.timestamp * 1000).toLocaleTimeString(
          'en-US',
          {
            hour: 'numeric',
            hour12: false,
          }
        )
        if (hourlyBuckets[hourLabel] !== undefined) {
          hourlyBuckets[hourLabel]++
        }
      }
    })

    return Object.entries(hourlyBuckets)
      .map(([hour, count]) => ({ hour, count }))
      .slice(-12)
  }, [blocks])

  // Prepare data growth chart (cumulative data count)
  const dataGrowthData: DataGrowthPoint[] = useMemo(() => {
    let cumulativeData = 0
    return blocks.map((block) => {
      cumulativeData += block.data_count
      return {
        blockIndex: block.index,
        cumulativeData,
      }
    })
  }, [blocks])

  // Calculate collection statistics
  const collectionStats: CollectionStats = useMemo(() => {
    const collections = collectionsData?.collections ?? []
    const totalCollections = collections.length
    const totalItems = collections.reduce(
      (sum, c) => sum + (c?.data_count ?? 0),
      0
    )
    const avgItemsPerCollection =
      totalCollections > 0 ? totalItems / totalCollections : 0
    const largestCollectionSize = collections.reduce(
      (max, c) => Math.max(max, c?.data_count ?? 0),
      0
    )

    return {
      totalCollections,
      totalItems,
      avgItemsPerCollection,
      largestCollectionSize,
    }
  }, [collectionsData])

  // Calculate validator performance
  const validatorPerformance: ValidatorStat[] = useMemo(() => {
    const validatorCounts: { [key: string]: number } = {}

    blocks.forEach((block) => {
      validatorCounts[block.validator] =
        (validatorCounts[block.validator] || 0) + 1
    })

    const totalBlocks = blocks.length
    const currentValidator = validatorInfo?.expected_validator ?? ''

    return Object.entries(validatorCounts)
      .map(([validator, blockCount]) => ({
        validator,
        blockCount,
        percentage: totalBlocks > 0 ? (blockCount / totalBlocks) * 100 : 0,
        isCurrentValidator: validator === currentValidator,
      }))
      .sort((a, b) => b.blockCount - a.blockCount)
  }, [blocks, validatorInfo])

  // Prepare recent activity
  const recentActivity: ActivityBlock[] = useMemo(() => {
    return [...blocks]
      .reverse()
      .slice(0, 20)
      .map((block) => ({
        index: block.index,
        timestamp: block.timestamp,
        dataCount: block.data_count,
        validator: block.validator,
        hasData: block.data_count > 0,
      }))
  }, [blocks])

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
        <h2 className="text-3xl font-bold text-white mb-2">
          Analytics & Statistics
        </h2>
        <p className="text-zinc-500">
          Blockchain metrics and performance insights
        </p>
      </div>

      <AnalyticsMetricsGrid metrics={keyMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlockCreationChart data={blockCreationData} />
        <DataGrowthChart data={dataGrowthData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CollectionStatsCard stats={collectionStats} />
        <ValidatorPerformanceCard
          validators={validatorPerformance}
          totalBlocks={blocks.length}
        />

        <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
          <h3 className="text-lg font-bold text-white mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-zinc-400">Cache Hit Rate</span>
                <span className="text-sm font-mono text-white">
                  {((metrics?.performance?.cache_hit_rate ?? 0) * 100).toFixed(
                    1
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-400 h-3 rounded-full transition-all"
                  style={{
                    width: `${(metrics?.performance?.cache_hit_rate ?? 0) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Total Operations</span>
                <span className="text-sm font-mono font-bold text-white">
                  {metrics?.performance?.operations_total ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Network Peers</span>
                <span className="text-sm font-mono font-bold text-white">
                  {metrics?.network?.peer_count ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecentActivityTimeline blocks={recentActivity} />
    </div>
  )
}
