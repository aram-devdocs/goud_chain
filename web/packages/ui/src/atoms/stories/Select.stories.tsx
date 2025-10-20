import type { Meta, StoryObj } from '@storybook/react'
import { Select } from '../Select'

const meta = {
  title: 'Atoms/Select',
  component: Select,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    error: { control: 'text' },
    helperText: { control: 'text' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Select an option',
    children: (
      <>
        <option value="">Choose...</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </>
    ),
  },
}

export const WithHelperText: Story = {
  args: {
    label: 'Event Type',
    helperText: 'Select the type of event to filter',
    children: (
      <>
        <option value="all">All Events</option>
        <option value="AccountCreated">Account Created</option>
        <option value="AccountLogin">Login</option>
        <option value="DataSubmitted">Data Submitted</option>
      </>
    ),
  },
}

export const WithError: Story = {
  args: {
    label: 'Required Field',
    error: 'This field is required',
    children: (
      <>
        <option value="">Choose...</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </>
    ),
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    disabled: true,
    children: (
      <>
        <option value="">Choose...</option>
        <option value="1">Option 1</option>
      </>
    ),
  },
}

export const FullWidth: Story = {
  args: {
    label: 'Full Width Select',
    fullWidth: true,
    children: (
      <>
        <option value="">Choose...</option>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
      </>
    ),
  },
}
