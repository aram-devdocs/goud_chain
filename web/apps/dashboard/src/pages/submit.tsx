import { useSubmitData, useToast } from '@goudchain/hooks'
import { SubmitDataForm, Stack, Heading } from '@goudchain/ui'

export default function SubmitPage() {
  const { success, error } = useToast()
  const submitMutation = useSubmitData()

  const handleSubmit = async (data: {
    label: string
    jsonData: string
  }): Promise<void> => {
    try {
      await submitMutation.mutateAsync({
        label: data.label,
        data: data.jsonData,
      })

      success('Data submitted successfully')
    } catch (err) {
      error((err as Error).message)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    success('Copied to clipboard')
  }

  return (
    <Stack direction="vertical" spacing={6}>
      <div>
        <Heading level={2}>Submit Data</Heading>
        <p className="text-zinc-500 mt-2">
          Encrypt and submit data to the blockchain
        </p>
      </div>

      <SubmitDataForm
        onSubmit={handleSubmit}
        onCopyToClipboard={handleCopy}
        isLoading={submitMutation.isPending}
      />
    </Stack>
  )
}
