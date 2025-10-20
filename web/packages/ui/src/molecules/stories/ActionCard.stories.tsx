import type { Meta, StoryObj } from '@storybook/react'
import { ActionCard } from '../ActionCard'

const meta = {
  title: 'Molecules/ActionCard',
  component: ActionCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
} satisfies Meta<typeof ActionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    title: 'Submit Data',
    description: 'Create encrypted collection',
    variant: 'primary',
  },
}

export const Secondary: Story = {
  args: {
    title: 'Browse Collections',
    description: 'View and decrypt your data',
    variant: 'secondary',
  },
}

export const QuickActions: Story = {
  args: {
    title: 'Submit Data',
    description: 'Create encrypted collection',
  },
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <ActionCard
        title="Submit Data"
        description="Create encrypted collection"
        variant="primary"
        onClick={() => console.log('Submit clicked')}
      />
      <ActionCard
        title="Browse Collections"
        description="View and decrypt your data"
        onClick={() => console.log('Browse clicked')}
      />
      <ActionCard
        title="Explore Blockchain"
        description="View blocks and analytics"
        onClick={() => console.log('Explore clicked')}
      />
    </div>
  ),
}
