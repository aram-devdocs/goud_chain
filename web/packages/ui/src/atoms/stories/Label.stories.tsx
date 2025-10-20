import type { Meta, StoryObj } from '@storybook/react'
import { Label } from '../Label'
import { Input } from '../Input'

const meta = {
  title: 'Atoms/Label',
  component: Label,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Email Address',
  },
}

export const WithInput: Story = {
  render: () => (
    <div className="w-64">
      <Label htmlFor="email">Email Address</Label>
      <Input
        id="email"
        type="email"
        placeholder="you@example.com"
        className="mt-2"
      />
    </div>
  ),
}

export const Required: Story = {
  render: () => (
    <div className="w-64">
      <Label htmlFor="password">
        Password <span className="text-red-500">*</span>
      </Label>
      <Input id="password" type="password" className="mt-2" required />
    </div>
  ),
}

export const WithHelperText: Story = {
  render: () => (
    <div className="w-64">
      <Label htmlFor="username">Username</Label>
      <Input id="username" type="text" className="mt-2" />
      <p className="mt-1 text-xs text-zinc-500">
        Choose a unique username (3-20 characters)
      </p>
    </div>
  ),
}

export const MultipleFields: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>
        <Label htmlFor="first-name">First Name</Label>
        <Input id="first-name" type="text" className="mt-2" />
      </div>
      <div>
        <Label htmlFor="last-name">Last Name</Label>
        <Input id="last-name" type="text" className="mt-2" />
      </div>
      <div>
        <Label htmlFor="email-multi">Email Address</Label>
        <Input id="email-multi" type="email" className="mt-2" />
      </div>
    </div>
  ),
}
