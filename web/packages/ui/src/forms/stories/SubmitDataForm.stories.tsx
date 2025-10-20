import type { Meta, StoryObj } from '@storybook/react'
import { SubmitDataForm } from '../SubmitDataForm'

const meta = {
  title: 'Forms/SubmitDataForm',
  component: SubmitDataForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SubmitDataForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Submitted:', data)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
    onCopyToClipboard: (text) => {
      console.log('Copied:', text)
    },
  },
}

export const WithInitialData: Story = {
  args: {
    ...Default.args,
    initialLabel: 'customer-records',
    initialData: '{"name": "John Doe", "age": 30, "active": true}',
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}

export const PrefilledFormMode: Story = {
  args: {
    ...Default.args,
    initialLabel: 'medical-records',
  },
}

export const EmptyForm: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Submitted:', data)
      await new Promise((resolve) => setTimeout(resolve, 500))
    },
  },
}
