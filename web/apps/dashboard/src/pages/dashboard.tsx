import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  useChainInfo,
  usePeers,
  useListCollections,
  useToast,
} from '@goudchain/hooks'
import {
  Spinner,
  Stack,
  Grid,
  MetricCard,
  ActivityFeed,
  ActionCard,
} from '@goudchain/ui'
import { formatNumber } from '@goudchain/utils'
import { SpinnerSize } from '@goudchain/types'
import { useWebSocketContext } from '../contexts/WebSocketContext'
import type { ActivityEvent } from '../contexts/WebSocketContext'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { error: showErrorToast } = useToast()
  const {
    isConnected: wsConnected,
    activityFeed,
    clearActivityFeed,
  } = useWebSocketContext()
  const [lastUpdated, setLastUpdated] = useState({
    blockchain: Date.now(),
    collections: Date.now(),
    network: Date.now(),
  })

  const {
    data: chainInfo,
    isLoading: chainLoading,
    error: chainError,
  } = useChainInfo()
  const {
    data: peersData,
    isLoading: peersLoading,
    error: peersError,
  } = usePeers()
  const {
    data: collections,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useListCollections()

  useEffect(() => {
    if (chainError) {
      showErrorToast('Failed to load blockchain data')
    }
    if (peersError) {
      showErrorToast('Failed to load network peers')
    }
    if (collectionsError) {
      showErrorToast('Failed to load collections')
    }
  }, [chainError, peersError, collectionsError, showErrorToast])

  // Update timestamps when data changes
  useEffect(() => {
    if (chainInfo) {
      setLastUpdated((prev) => ({ ...prev, blockchain: Date.now() }))
    }
  }, [chainInfo])

  useEffect(() => {
    if (collections) {
      setLastUpdated((prev) => ({ ...prev, collections: Date.now() }))
    }
  }, [collections])

  useEffect(() => {
    if (peersData) {
      setLastUpdated((prev) => ({ ...prev, network: Date.now() }))
    }
  }, [peersData])

  if (chainLoading || peersLoading || collectionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  return (
    <Stack direction="vertical" spacing={6}>
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-zinc-500">Overview of your blockchain activity</p>
      </div>

      {/* Metrics Grid */}
      <Grid columns={{ sm: 2, md: 2, lg: 4 }} gap={4}>
        <MetricCard
          label="BLOCKCHAIN"
          value={formatNumber(chainInfo?.chain?.length ?? 0)}
          description="Total Blocks"
          lastUpdated={lastUpdated.blockchain}
          variant="blue"
        />

        <MetricCard
          label="COLLECTIONS"
          value={formatNumber(collections?.collections.length ?? 0)}
          description="Your Data"
          lastUpdated={lastUpdated.collections}
          variant="green"
        />

        <MetricCard
          label="NETWORK"
          value={formatNumber(peersData?.peers?.length ?? 0)}
          description="Connected Peers"
          lastUpdated={lastUpdated.network}
          variant="purple"
        />

        <MetricCard
          label="CONNECTION"
          value={wsConnected ? 'Live' : 'Polling'}
          description="WebSocket Status"
          variant="zinc"
        />
      </Grid>

      {/* Activity Feed */}
      <ActivityFeed
        activities={activityFeed}
        onClear={clearActivityFeed}
        maxItems={10}
      />

      {/* Quick Actions */}
      <Grid columns={{ sm: 1, md: 3 }} gap={4}>
        <ActionCard
          title="Submit Data"
          description="Create encrypted collection"
          variant="primary"
          onClick={() => navigate({ to: '/submit' })}
        />

        <ActionCard
          title="Browse Collections"
          description="View and decrypt your data"
          onClick={() => navigate({ to: '/collections' })}
        />

        <ActionCard
          title="Explore Blockchain"
          description="View blocks and analytics"
          onClick={() => navigate({ to: '/explorer' })}
        />
      </Grid>
    </Stack>
  )
}
