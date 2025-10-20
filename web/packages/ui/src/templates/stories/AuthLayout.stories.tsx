import type { Meta, StoryObj } from '@storybook/react'
import { AuthLayout } from '../AuthLayout'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Label,
} from '../../index'
import { ButtonVariant } from '@goudchain/types'

const meta = {
  title: 'Templates/AuthLayout',
  component: AuthLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AuthLayout>

export default meta
type Story = StoryObj<typeof meta>

export const WithLoginForm: Story = {
  args: {
    children: (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Goud Chain</CardTitle>
          <p className="text-sm text-zinc-500 mt-2">Encrypted Blockchain</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Paste your API key"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    ),
  },
}

export const WithCreateAccountForm: Story = {
  args: {
    children: (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <p className="text-sm text-zinc-500 mt-2">Generate your API key</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
              <p className="font-medium text-zinc-300 mb-2 text-xs">
                About API Keys
              </p>
              <ul className="text-zinc-500 space-y-1 text-xs">
                <li>• Your API key is your authentication credential</li>
                <li>• It will only be shown once - save it securely</li>
                <li>• Anyone with your API key can access your data</li>
              </ul>
            </div>

            <Button type="submit" className="w-full">
              Generate API Key
            </Button>
          </div>
        </CardContent>
      </Card>
    ),
  },
}

export const WithError: Story = {
  args: {
    children: (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-red-400">Error</CardTitle>
          <p className="text-sm text-zinc-500 mt-2">Something went wrong</p>
        </CardHeader>
        <CardContent>
          <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg text-sm text-red-400 mb-4">
            Invalid API key format. Please check and try again.
          </div>
          <Button variant={ButtonVariant.Secondary} className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    ),
  },
}

export const WithLoadingState: Story = {
  args: {
    children: (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Logging In</CardTitle>
          <p className="text-sm text-zinc-500 mt-2">Please wait...</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        </CardContent>
      </Card>
    ),
  },
}
