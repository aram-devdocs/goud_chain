import { Card, CardHeader, CardTitle, CardContent } from '@goudchain/ui'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Analytics</h2>
        <p className="text-zinc-500">Blockchain analytics and visualizations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chain Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500">
            Analytics charts will be displayed here
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
