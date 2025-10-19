import { useState, useMemo } from 'react'
import {
  usePeers,
  useChainInfo,
  useValidator,
  useSync,
  useToast,
} from '@goudchain/hooks'
import {
  NetworkHealthCard,
  NodeStatsGrid,
  PeerConnectivityTable,
  NetworkActions,
  Spinner,
  type NetworkHealth,
  type NodeStats,
  type PeerInfo,
} from '@goudchain/ui'
import { SpinnerSize } from '@goudchain/types'

function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp
  const seconds = Math.floor(diff)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function NetworkPage() {
  const {
    data: peers,
    isLoading: peersLoading,
    refetch: refetchPeers,
  } = usePeers()
  const {
    data: chainInfo,
    isLoading: chainLoading,
    refetch: refetchChain,
  } = useChainInfo()
  const { data: validatorInfo, isLoading: validatorLoading } = useValidator()
  const syncMutation = useSync()
  const { success } = useToast()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const isLoading = peersLoading || chainLoading || validatorLoading

  // Calculate network health
  const networkHealth: NetworkHealth = useMemo(() => {
    const peerCount = peers?.count ?? 0
    const currentValidator = validatorInfo?.expected_validator ?? 'Unknown'
    const isThisNodeValidator = validatorInfo?.is_this_node_validator ?? false

    // Calculate health score
    let healthScore = 0

    // Network connectivity (40 points)
    if (peerCount >= 2) healthScore += 40
    else if (peerCount === 1) healthScore += 20

    // Sync status (40 points) - assume synced for now
    healthScore += 40

    // Validator participation (20 points)
    if (isThisNodeValidator) healthScore += 20
    else healthScore += 10

    return {
      status: peerCount > 0 ? 'connected' : 'disconnected',
      syncStatus: 'synced', // TODO: Calculate based on peer chain lengths
      peerCount,
      currentValidator,
      isThisNodeValidator,
      healthScore,
    }
  }, [peers, validatorInfo])

  // Calculate node stats
  const nodeStats: NodeStats = useMemo(() => {
    const chainLength = chainInfo?.chain?.length ?? 0
    const latestBlock = chainInfo?.chain?.[chainLength - 1]
    const latestBlockAge = latestBlock
      ? formatRelativeTime(latestBlock.timestamp)
      : 'N/A'

    return {
      nodeId: validatorInfo?.current_node_id ?? 'Unknown',
      chainLength,
      latestBlockAge,
      isValidator: validatorInfo?.is_this_node_validator ?? false,
      nextValidatorTurn: validatorInfo?.is_this_node_validator
        ? `Block #${validatorInfo.next_block_number}`
        : undefined,
      syncStatus: 'Up to date',
      blocksBehind: 0,
    }
  }, [chainInfo, validatorInfo])

  // Transform peers data for table
  const peerInfoList: PeerInfo[] = useMemo(() => {
    if (!peers?.peers) return []

    return peers.peers.map((peerAddress) => {
      // Extract role from address (node1:9000 -> Validator_1)
      const nodeMatch = peerAddress.match(/node(\d+)/)
      const nodeNumber = nodeMatch ? nodeMatch[1] : '?'
      const role = `Validator_${nodeNumber}`

      return {
        address: peerAddress,
        role,
        chainLength: undefined, // TODO: Get from peer info when available
        lastSeen: undefined, // TODO: Get from peer info when available
        isCurrentValidator: role === validatorInfo?.expected_validator,
      }
    })
  }, [peers, validatorInfo])

  const handleSyncAll = () => {
    syncMutation.mutate()
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([refetchPeers(), refetchChain()])
    setIsRefreshing(false)
    success('Network data refreshed')
  }

  const handleSyncPeer = (peerAddress: string) => {
    // TODO: Implement peer-specific sync
    success(`Syncing with ${peerAddress}...`)
    syncMutation.mutate()
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    success('Copied to clipboard')
  }

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
        <h2 className="text-3xl font-bold text-white mb-2">Network Status</h2>
        <p className="text-zinc-500">
          P2P network health and peer connectivity
        </p>
      </div>

      {/* Network Health Overview */}
      <NetworkHealthCard health={networkHealth} nodeId={nodeStats.nodeId} />

      {/* Node Stats Grid */}
      <NodeStatsGrid stats={nodeStats} />

      {/* Peer Connectivity Table */}
      <PeerConnectivityTable
        peers={peerInfoList}
        localChainLength={nodeStats.chainLength}
        onSync={handleSyncPeer}
        onCopy={handleCopy}
      />

      {/* Network Actions */}
      <NetworkActions
        onSyncAll={handleSyncAll}
        onRefresh={handleRefresh}
        isSyncing={syncMutation.isPending}
        isRefreshing={isRefreshing}
      />
    </div>
  )
}
