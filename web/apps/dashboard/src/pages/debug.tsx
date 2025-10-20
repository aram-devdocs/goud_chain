import { useState } from 'react'
import { useChainInfo, useMetrics, useListCollections } from '@goudchain/hooks'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Stack,
  Heading,
  Text,
} from '@goudchain/ui'
import { ButtonVariant } from '@goudchain/types'

export default function DebugPage() {
  const [showRaw, setShowRaw] = useState(false)
  const { data: chainInfo } = useChainInfo()
  const { data: metrics } = useMetrics()
  const { data: collections } = useListCollections()

  return (
    <Stack direction="vertical" spacing={6}>
      <div>
        <Heading level={2}>Debug</Heading>
        <Text size="sm" color="zinc-500" className="mt-2">
          Development tools and raw data inspection
        </Text>
      </div>

      <div className="flex gap-2">
        <Button
          variant={showRaw ? ButtonVariant.Primary : ButtonVariant.Secondary}
          onClick={() => setShowRaw(!showRaw)}
        >
          {showRaw ? 'Hide' : 'Show'} Raw Data
        </Button>
      </div>

      {showRaw && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Chain Info (Raw)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-zinc-900 p-4 rounded overflow-x-auto">
                {JSON.stringify(chainInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics (Raw)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-zinc-900 p-4 rounded overflow-x-auto">
                {JSON.stringify(metrics, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collections (Raw)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-zinc-900 p-4 rounded overflow-x-auto">
                {JSON.stringify(collections, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Local Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Session Token:</span>
              <span className="text-white">
                {localStorage.getItem('session_token') ? 'Present' : 'Missing'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">User ID:</span>
              <span className="text-white">
                {localStorage.getItem('user_id') || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">API Key:</span>
              <span className="text-white">
                {localStorage.getItem('api_key') ? 'Present' : 'Missing'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Stack>
  )
}
