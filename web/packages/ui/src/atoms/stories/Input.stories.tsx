import type { Meta, StoryObj } from '@storybook/react'
import { Input } from '../Input'
import { Label } from '../Label'

const meta = {
  title: 'Atoms/Input',
  component: Input,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'url', 'tel'],
    },
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter your email',
  },
  render: (args) => (
    <div>
      <Label htmlFor="email">Email</Label>
      <Input id="email" {...args} />
    </div>
  ),
}

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter your password',
  },
  render: (args) => (
    <div>
      <Label htmlFor="password">Password</Label>
      <Input id="password" {...args} />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: 'Cannot edit this',
  },
  render: (args) => (
    <div>
      <Label htmlFor="disabled">Disabled Input</Label>
      <Input id="disabled" {...args} />
    </div>
  ),
}

export const MonospaceApiKey: Story = {
  args: {
    type: 'password',
    placeholder: 'Paste your API key',
    className: 'font-mono text-sm',
  },
  render: (args) => (
    <div>
      <Label htmlFor="apikey">API Key</Label>
      <Input id="apikey" {...args} />
    </div>
  ),
}

export const Required: Story = {
  args: {
    required: true,
    placeholder: 'Enter collection name',
  },
  render: (args) => (
    <div>
      <Label htmlFor="collection">Collection Name *</Label>
      <Input id="collection" {...args} />
    </div>
  ),
}
