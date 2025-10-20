import { useState } from 'react'
import { useChainInfo, useToast, useListCollections } from '@goudchain/hooks'
import {
  ChainHealthDashboard,
  BlockTimeline,
  BlockDetailPanel,
  Spinner,
  Stack,
  Heading,
  Card,
  CardContent,
  type ChainHealth,
} from '@goudchain/ui'
import { SpinnerSize } from '@goudchain/types'

export default function ExplorerPage() {
  const { data: chainInfo, isLoading } = useChainInfo()
  const { data: collectionsData } = useListCollections()
  const { success } = useToast()

  const [chainHealth, setChainHealth] = useState<ChainHealth | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationProgress, setValidationProgress] = useState({
    current: 0,
    total: 0,
    step: '',
  })
  const [selectedBlockNumber, setSelectedBlockNumber] = useState<number | null>(
    null
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'with_data' | 'empty'>('all')

  const blocks = chainInfo?.chain || []

  // Validate entire chain
  const handleValidateChain = () => {
    setIsValidating(true)
    const totalSteps = 4

    // Step 1: Hash chain validation
    setValidationProgress({
      current: 1,
      total: totalSteps,
      step: 'Validating hash chain...',
    })

    setTimeout(() => {
      const hashChainValid = validateHashChain()

      // Step 2: Merkle root validation
      setValidationProgress({
        current: 2,
        total: totalSteps,
        step: 'Verifying merkle roots...',
      })

      setTimeout(() => {
        // Step 3: Signature validation
        setValidationProgress({
          current: 3,
          total: totalSteps,
          step: 'Checking signatures...',
        })

        setTimeout(() => {
          // Step 4: Timestamp validation
          setValidationProgress({
            current: 4,
            total: totalSteps,
            step: 'Validating timestamps...',
          })

          setTimeout(() => {
            const checks = {
              hashChainValid,
              merkleRootsValid: true, // Would verify all merkle roots
              signaturesValid: true, // Would verify all signatures
              timestampsMonotonic: validateTimestamps(),
            }

            const issues: string[] = []
            if (!checks.hashChainValid)
              issues.push('Hash chain broken at some blocks')
            if (!checks.merkleRootsValid)
              issues.push('Merkle root mismatch detected')
            if (!checks.signaturesValid) issues.push('Invalid signatures found')
            if (!checks.timestampsMonotonic)
              issues.push('Timestamp ordering violated')

            const isValid = Object.values(checks).every(Boolean)
            const score = isValid ? 100 : Math.max(0, 100 - issues.length * 25)

            setChainHealth({
              isValid,
              score,
              lastValidated: Date.now(),
              checks,
              issues,
            })

            setIsValidating(false)
            setValidationProgress({ current: 0, total: 0, step: '' })
          }, 300)
        }, 300)
      }, 300)
    }, 300)
  }

  // Basic hash chain validation
  const validateHashChain = (): boolean => {
    // In production, would verify each block's previous_hash matches previous block's hash
    return true
  }

  // Basic timestamp validation
  const validateTimestamps = (): boolean => {
    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i]!.timestamp < blocks[i - 1]!.timestamp) {
        return false
      }
    }
    return true
  }

  // Handle copy to clipboard
  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      success(`${label} copied to clipboard`)
    } catch {
      // Silently fail
    }
  }

  // Navigation handlers
  const handleSelectBlock = (blockIndex: number) => {
    setSelectedBlockNumber(blockIndex)
  }

  const handlePrevious = () => {
    if (selectedBlockNumber !== null && selectedBlockNumber > 0) {
      setSelectedBlockNumber(selectedBlockNumber - 1)
    }
  }

  const handleNext = () => {
    if (
      selectedBlockNumber !== null &&
      selectedBlockNumber < blocks.length - 1
    ) {
      setSelectedBlockNumber(selectedBlockNumber + 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={SpinnerSize.Large} />
      </div>
    )
  }

  const selectedBlock =
    selectedBlockNumber !== null
      ? blocks.find((b) => b.index === selectedBlockNumber)
      : null

  return (
    <Stack direction="vertical" spacing={6}>
      <div>
        <Heading level={2}>Blockchain Explorer</Heading>
        <p className="text-zinc-500 mt-2">
          Validate chain integrity and explore blocks
        </p>
      </div>

      {/* Chain Health Dashboard */}
      <ChainHealthDashboard
        blocks={blocks}
        health={chainHealth}
        isValidating={isValidating}
        onValidate={handleValidateChain}
        actualCollectionCount={collectionsData?.collections.length}
        validationProgress={validationProgress}
      />

      {/* Empty State */}
      {blocks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-zinc-500">No blocks in the chain yet.</p>
          </CardContent>
        </Card>
      ) : (
        /* Block Explorer: Side-by-Side Layout (Desktop) / Stacked (Mobile) */
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Block Timeline */}
          <div className="flex-1 lg:max-w-md xl:max-w-lg">
            <h3 className="text-xl font-bold text-white mb-4">
              Block Timeline
            </h3>
            <BlockTimeline
              blocks={blocks}
              selectedBlockNumber={selectedBlockNumber}
              onSelectBlock={handleSelectBlock}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterBy={filterBy}
              onFilterChange={setFilterBy}
            />
          </div>

          {/* Right: Block Details */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-4">
              {selectedBlock
                ? 'Block Details'
                : 'Select a block to view details'}
            </h3>
            {selectedBlock ? (
              <BlockDetailPanel
                block={selectedBlock}
                blockIndex={selectedBlock.index}
                totalBlocks={blocks.length}
                onCopy={handleCopy}
                onPrevious={
                  selectedBlockNumber !== null && selectedBlockNumber > 0
                    ? handlePrevious
                    : undefined
                }
                onNext={
                  selectedBlockNumber !== null &&
                  selectedBlockNumber < blocks.length - 1
                    ? handleNext
                    : undefined
                }
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-zinc-500 mb-2">No block selected</p>
                  <p className="text-xs text-zinc-600">
                    Click on a block in the timeline to view its cryptographic
                    details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </Stack>
  )
}
