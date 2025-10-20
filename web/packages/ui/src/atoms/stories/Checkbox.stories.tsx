import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from '../Checkbox'

const meta = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    helperText: { control: 'text' },
    disabled: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
}

export const Checked: Story = {
  args: {
    label: 'I have saved my API key',
    checked: true,
  },
}

export const WithHelperText: Story = {
  args: {
    label: 'Remember me',
    helperText: 'Keep me logged in on this device',
  },
}

export const WithError: Story = {
  args: {
    label: 'Required checkbox',
    error: 'You must accept to continue',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled option',
    disabled: true,
  },
}

export const DisabledChecked: Story = {
  args: {
    label: 'Disabled and checked',
    disabled: true,
    checked: true,
  },
}

export const MultipleCheckboxes: Story = {
  render: () => (
    <div className="space-y-3">
      <Checkbox label="Option 1" />
      <Checkbox label="Option 2" checked />
      <Checkbox label="Option 3" />
      <Checkbox label="Option 4 (disabled)" disabled />
    </div>
  ),
}
