import type { Meta, StoryObj } from '@storybook/react'
import { ProgressBar } from '../ProgressBar'

const meta = {
  title: 'Molecules/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 5 } },
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'error'],
    },
    showLabel: { control: 'boolean' },
  },
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 60,
  },
}

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
    label: 'Upload Progress',
  },
}

export const Primary: Story = {
  args: {
    value: 45,
    variant: 'primary',
    showLabel: true,
    label: 'Primary',
  },
}

export const Success: Story = {
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
    label: 'Complete',
  },
}

export const Warning: Story = {
  args: {
    value: 80,
    variant: 'warning',
    showLabel: true,
    label: 'Warning',
  },
}

export const Error: Story = {
  args: {
    value: 25,
    variant: 'error',
    showLabel: true,
    label: 'Error',
  },
}

export const ValidationProgress: Story = {
  args: {
    value: 50,
  },
  render: () => (
    <div className="space-y-4">
      <ProgressBar
        value={100}
        variant="success"
        showLabel
        label="Step 1: Hash Chain Validation"
      />
      <ProgressBar
        value={100}
        variant="success"
        showLabel
        label="Step 2: Merkle Root Verification"
      />
      <ProgressBar
        value={50}
        variant="primary"
        showLabel
        label="Step 3: Signature Validation"
      />
      <ProgressBar value={0} showLabel label="Step 4: Timestamp Validation" />
    </div>
  ),
}
