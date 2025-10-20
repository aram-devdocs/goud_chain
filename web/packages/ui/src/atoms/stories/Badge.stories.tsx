import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../Badge'

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'error', 'warning', 'info'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Default',
  },
}

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Error',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="error">Error</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
}

export const EventTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="success">AccountCreated</Badge>
        <span className="text-zinc-400 text-sm">Account Created</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="primary">AccountLogin</Badge>
        <span className="text-zinc-400 text-sm">Login Event</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="info">DataSubmitted</Badge>
        <span className="text-zinc-400 text-sm">Data Submission</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="warning">DataDecrypted</Badge>
        <span className="text-zinc-400 text-sm">Decryption Event</span>
      </div>
    </div>
  ),
}
