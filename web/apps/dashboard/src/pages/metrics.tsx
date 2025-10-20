import { useMetrics } from '@goudchain/hooks'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Spinner,
  Stack,
  Grid,
  Heading,
  Text,
  ProgressBar,
} from '@goudchain/ui'
import { formatNumber, formatDate } from '@goudchain/utils'
import { SpinnerSize } from '@goudchain/types'

export default function MetricsPage() {
  const { data, isLoading } = useMetrics()

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
        <Heading level={2}>System Metrics</Heading>
        <Text size="sm" color="zinc-500" className="mt-2">
          Real-time system performance metrics
        </Text>
      </div>

      <Grid columns={{ sm: 1, md: 3 }} gap={6}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">
              Chain Length
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(data?.chain?.length ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">Peer Count</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(data?.network?.peer_count ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400">
              Operations Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-white font-mono">
              {formatNumber(data?.performance?.operations_total ?? 0)}
            </p>
          </CardContent>
        </Card>
      </Grid>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ProgressBar
            value={(data?.performance?.cache_hit_rate ?? 0) * 100}
            variant="success"
            showLabel
            label="Cache Hit Rate"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Latest Block Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Block Number:</span>
            <span className="text-white">
              {data?.chain?.latest_block_number ?? 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Block Timestamp:</span>
            <span className="text-white">
              {data?.chain?.latest_block_timestamp
                ? formatDate(data.chain.latest_block_timestamp)
                : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Stack>
  )
}
