import { Card, CardHeader, CardTitle, CardContent } from '@workspace/ui'

export default function NetworkPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Network</h2>
        <p className="text-zinc-500">P2P network status and peer information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500">Network information will be displayed here</p>
        </CardContent>
      </Card>
    </div>
  )
}
