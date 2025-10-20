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
  Stack,
  Grid,
  Heading,
  Text,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ProgressBar,
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
    <Stack direction="vertical" spacing={6}>
      <div>
        <Heading level={2}>Analytics & Statistics</Heading>
        <Text size="sm" color="zinc-500" className="mt-2">
          Blockchain metrics and performance insights
        </Text>
      </div>

      <AnalyticsMetricsGrid metrics={keyMetrics} />

      <Grid columns={{ sm: 1, lg: 2 }} gap={6}>
        <BlockCreationChart data={blockCreationData} />
        <DataGrowthChart data={dataGrowthData} />
      </Grid>

      <Grid columns={{ sm: 1, md: 2, lg: 3 }} gap={6}>
        <CollectionStatsCard stats={collectionStats} />
        <ValidatorPerformanceCard
          validators={validatorPerformance}
          totalBlocks={blocks.length}
        />

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack direction="vertical" spacing={4}>
              <ProgressBar
                value={(metrics?.performance?.cache_hit_rate ?? 0) * 100}
                variant="primary"
                showLabel
                label="Cache Hit Rate"
              />

              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <Text size="sm" color="zinc-400">
                    Total Operations
                  </Text>
                  <Text size="sm" mono weight="bold" color="white">
                    {metrics?.performance?.operations_total ?? 0}
                  </Text>
                </div>
                <div className="flex items-center justify-between">
                  <Text size="sm" color="zinc-400">
                    Network Peers
                  </Text>
                  <Text size="sm" mono weight="bold" color="white">
                    {metrics?.network?.peer_count ?? 0}
                  </Text>
                </div>
              </div>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <RecentActivityTimeline blocks={recentActivity} />
    </Stack>
  )
}
