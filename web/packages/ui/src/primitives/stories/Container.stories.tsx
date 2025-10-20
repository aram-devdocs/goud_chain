import type { Meta, StoryObj } from '@storybook/react'
import { Container } from '../Container'

const meta = {
  title: 'Primitives/Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl', 'full'],
      description: 'Maximum width constraint',
    },
    noPadding: {
      control: 'boolean',
      description: 'Remove horizontal padding',
    },
  },
} satisfies Meta<typeof Container>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">
          Container with default max-width (xl) and responsive padding
        </p>
      </div>
    ),
  },
}

export const Small: Story = {
  args: {
    maxWidth: 'sm',
    children: (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Small container (max-width: 640px)</p>
      </div>
    ),
  },
}

export const Medium: Story = {
  args: {
    maxWidth: 'md',
    children: (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Medium container (max-width: 768px)</p>
      </div>
    ),
  },
}

export const Large: Story = {
  args: {
    maxWidth: 'lg',
    children: (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Large container (max-width: 1024px)</p>
      </div>
    ),
  },
}

export const ExtraLarge: Story = {
  args: {
    maxWidth: 'xl',
    children: (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Extra large container (max-width: 1280px)</p>
      </div>
    ),
  },
}

export const Full: Story = {
  args: {
    maxWidth: 'full',
    children: (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">
          Full width container (no max-width constraint)
        </p>
      </div>
    ),
  },
}

export const NoPadding: Story = {
  args: {
    noPadding: true,
    children: (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-6">
        <p className="text-white">Container with no horizontal padding</p>
      </div>
    ),
  },
}
