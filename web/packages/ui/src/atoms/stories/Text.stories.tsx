import type { Meta, StoryObj } from '@storybook/react'
import { Text } from '../Text'

const meta = {
  title: 'Atoms/Text',
  component: Text,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'base', 'lg', 'xl'],
    },
    color: {
      control: 'select',
      options: ['white', 'zinc-100', 'zinc-300', 'zinc-400', 'zinc-500'],
    },
    weight: {
      control: 'select',
      options: ['normal', 'medium', 'semibold', 'bold'],
    },
    mono: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Text>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'This is default body text using the design system typography.',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-2">
      <Text size="xs">Extra small text (12px)</Text>
      <Text size="sm">Small text (14px)</Text>
      <Text size="base">Base text (16px)</Text>
      <Text size="lg">Large text (18px)</Text>
      <Text size="xl">Extra large text (20px)</Text>
    </div>
  ),
}

export const AllColors: Story = {
  render: () => (
    <div className="space-y-2">
      <Text color="white">White text (highest contrast)</Text>
      <Text color="zinc-100">Zinc-100 (very light gray)</Text>
      <Text color="zinc-300">Zinc-300 (medium-light gray)</Text>
      <Text color="zinc-400">Zinc-400 (medium gray)</Text>
      <Text color="zinc-500">Zinc-500 (muted gray)</Text>
    </div>
  ),
}

export const AllWeights: Story = {
  render: () => (
    <div className="space-y-2">
      <Text weight="normal">Normal weight (400)</Text>
      <Text weight="medium">Medium weight (500)</Text>
      <Text weight="semibold">Semibold weight (600)</Text>
      <Text weight="bold">Bold weight (700)</Text>
    </div>
  ),
}

export const Monospace: Story = {
  args: {
    mono: true,
    children: 'abc123def456 - Monospace font for code and hashes',
  },
}

export const TechnicalData: Story = {
  render: () => (
    <div className="space-y-3">
      <div>
        <Text size="sm" color="zinc-400">
          Block Hash
        </Text>
        <Text mono color="zinc-100" size="sm">
          0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
        </Text>
      </div>
      <div>
        <Text size="sm" color="zinc-400">
          Timestamp
        </Text>
        <Text mono color="zinc-100" size="sm">
          2025-10-19 20:30:45 UTC
        </Text>
      </div>
      <div>
        <Text size="sm" color="zinc-400">
          Validator
        </Text>
        <Text mono color="zinc-100" size="sm">
          node-1.goudchain.local:9000
        </Text>
      </div>
    </div>
  ),
}

export const Paragraph: Story = {
  args: {
    children:
      'This is a longer paragraph of text demonstrating how the Text component handles multiple lines. It uses the design system typography tokens for consistent spacing and readability across the application.',
  },
}
