import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from '../Textarea'

const meta = {
  title: 'Atoms/Textarea',
  component: Textarea,
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
    rows: { control: 'number' },
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Description',
    placeholder: 'Enter your description here...',
  },
}

export const WithHelperText: Story = {
  args: {
    label: 'JSON Data',
    helperText: 'Enter valid JSON data',
    placeholder: '{"key": "value"}',
    rows: 8,
  },
}

export const WithError: Story = {
  args: {
    label: 'Required Field',
    error: 'This field cannot be empty',
    placeholder: 'Enter text...',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Textarea',
    disabled: true,
    value: 'This field is disabled',
  },
}

export const FullWidth: Story = {
  args: {
    label: 'Full Width Textarea',
    fullWidth: true,
    placeholder: 'This textarea spans the full width',
    rows: 6,
  },
}

export const LargeRows: Story = {
  args: {
    label: 'Large Text Area',
    rows: 12,
    placeholder: 'A textarea with 12 rows for longer content...',
  },
}
