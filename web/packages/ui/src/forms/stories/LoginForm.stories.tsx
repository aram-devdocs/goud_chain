import type { Meta, StoryObj } from '@storybook/react'
import { LoginForm } from '../LoginForm'

const meta = {
  title: 'Forms/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoginForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onLogin: async (apiKey) => {
      console.log('Login with:', apiKey)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
    onCreate: async () => {
      console.log('Creating account...')
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return {
        api_key: 'goud_test_' + Math.random().toString(36).substring(2, 50),
        account_id: 'usr_' + Math.random().toString(36).substring(2, 15),
      }
    },
    onLoginWithNewKey: async (apiKey) => {
      console.log('Login with new key:', apiKey)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    },
    onCopyToClipboard: (text) => {
      console.log('Copied:', text)
    },
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
}

export const WithError: Story = {
  args: {
    ...Default.args,
    error: 'Invalid API key format. Please check and try again.',
  },
}

export const CreateAccountTab: Story = {
  args: {
    ...Default.args,
  },
  play: async ({ canvasElement }) => {
    // Simulate clicking the "Create Account" button in Storybook
    // This story is just for visual reference
  },
}
