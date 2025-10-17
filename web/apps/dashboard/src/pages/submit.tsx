import { useState } from 'react'
import { useSubmitData, useToast } from '@goudchain/hooks'
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@goudchain/ui'
import { encryptData } from '@goudchain/utils'

export default function SubmitPage() {
  const [collectionId, setCollectionId] = useState('')
  const [data, setData] = useState('')
  const { success, error } = useToast()
  const submitMutation = useSubmitData()

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()
    try {
      const apiKey = localStorage.getItem('api_key')
      if (!apiKey) {
        error('API key not found. Please log in again.')
        return
      }

      const encryptedData = await encryptData(data, apiKey)
      await submitMutation.mutateAsync({
        collection_id: collectionId,
        encrypted_data: encryptedData,
      })

      success('Data submitted successfully')
      setData('')
    } catch (err) {
      error((err as Error).message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Submit Data</h2>
        <p className="text-zinc-500">
          Encrypt and submit data to the blockchain
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Encrypt & Submit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="collectionId">Collection ID</Label>
              <Input
                id="collectionId"
                value={collectionId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCollectionId(e.target.value)
                }
                placeholder="e.g., medical_records"
                required
                className="mt-1"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Group related data together using a collection identifier
              </p>
            </div>

            <div>
              <Label htmlFor="data">Data (will be encrypted)</Label>
              <textarea
                id="data"
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="Enter your data here..."
                required
                rows={6}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white mt-1"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Data is encrypted client-side before submission
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Data'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
