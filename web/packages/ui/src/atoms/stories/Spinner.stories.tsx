import type { Meta, StoryObj } from '@storybook/react'
import { Spinner } from '../Spinner'
import { SpinnerSize } from '@goudchain/types'

const meta = {
  title: 'Atoms/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(SpinnerSize),
    },
  },
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    size: SpinnerSize.Small,
  },
}

export const Medium: Story = {
  args: {
    size: SpinnerSize.Medium,
  },
}

export const Large: Story = {
  args: {
    size: SpinnerSize.Large,
  },
}

export const AllSizes: Story = {
  args: {
    size: SpinnerSize.Medium,
  },
  render: () => (
    <div className="flex items-end gap-8">
      <div className="flex flex-col items-center gap-2">
        <Spinner size={SpinnerSize.Small} />
        <span className="text-xs text-zinc-400">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size={SpinnerSize.Medium} />
        <span className="text-xs text-zinc-400">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size={SpinnerSize.Large} />
        <span className="text-xs text-zinc-400">Large</span>
      </div>
    </div>
  ),
}

export const LoadingState: Story = {
  args: {
    size: SpinnerSize.Large,
  },
  render: () => (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Spinner size={SpinnerSize.Large} />
      <p className="text-zinc-400">Loading data...</p>
    </div>
  ),
}
