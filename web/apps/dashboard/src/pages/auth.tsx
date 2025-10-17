import { useState } from 'react'
import { useAuth, useCreateAccount, useLogin, useToast } from '@goudchain/hooks'
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@goudchain/ui'
import { ButtonVariant, ButtonSize } from '@goudchain/types'
import { validateApiKey } from '@goudchain/utils'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [newAccount, setNewAccount] = useState<{
    api_key: string
    account_id: string
  } | null>(null)
  const [apiKeyConfirmed, setApiKeyConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)

  const { login } = useAuth()
  const { success, error } = useToast()
  const createAccountMutation = useCreateAccount()
  const loginMutation = useLogin()

  const handleCreateAccount = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()

    try {
      // Original auth.html sends { metadata: null }, just generates an API key
      const result = await createAccountMutation.mutateAsync({
        metadata: null,
      })
      setNewAccount({
        api_key: result.api_key,
        account_id: result.account_id || result.user_id,
      })
      success('API key generated! Save it securely.')
    } catch (err) {
      error((err as Error).message)
    }
  }

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()

    // Validate API key format
    const validation = validateApiKey(apiKey)
    if (!validation.valid) {
      error(validation.error ?? 'Invalid API key')
      return
    }

    try {
      const result = await loginMutation.mutateAsync({
        api_key: apiKey.trim(),
      })
      login(result)
      success('Logged in successfully')
    } catch (err) {
      error((err as Error).message)
    }
  }

  const loginWithNewKey = async (): Promise<void> => {
    if (!newAccount || !apiKeyConfirmed) return

    try {
      const result = await loginMutation.mutateAsync({
        api_key: newAccount.api_key,
      })
      login(result)
      success('Logged in successfully')
    } catch (err) {
      error((err as Error).message)
    }
  }

  const copyApiKey = (): void => {
    if (!newAccount) return

    navigator.clipboard.writeText(newAccount.api_key)
    setCopied(true)
    success('API key copied to clipboard')

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Goud Chain</CardTitle>
          <p className="text-sm text-zinc-500 mt-2">Encrypted Blockchain</p>
        </CardHeader>
        <CardContent>
          {/* Tab Selector */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={
                isLogin ? ButtonVariant.Primary : ButtonVariant.Secondary
              }
              onClick={() => {
                setIsLogin(true)
                setNewAccount(null)
                setApiKeyConfirmed(false)
              }}
              className="flex-1"
            >
              Login
            </Button>
            <Button
              variant={
                !isLogin ? ButtonVariant.Primary : ButtonVariant.Secondary
              }
              onClick={() => {
                setIsLogin(false)
                setNewAccount(null)
                setApiKeyConfirmed(false)
              }}
              className="flex-1"
            >
              Create Account
            </Button>
          </div>

          {/* Login Tab */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setApiKey(e.target.value)
                  }
                  placeholder="Paste your API key"
                  required
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1">Enter your API key</p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending || !apiKey}
              >
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          ) : (
            <>
              {/* Create Account - Before Generation */}
              {!newAccount ? (
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
                    <p className="font-medium text-zinc-300 mb-2 text-xs">
                      About API Keys
                    </p>
                    <ul className="text-zinc-500 space-y-1 text-xs">
                      <li>• Your API key is your authentication credential</li>
                      <li>• It will only be shown once - save it securely</li>
                      <li>• Anyone with your API key can access your data</li>
                      <li>• Lost keys cannot be recovered</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createAccountMutation.isPending}
                  >
                    {createAccountMutation.isPending
                      ? 'Generating...'
                      : 'Generate API Key'}
                  </Button>
                </form>
              ) : (
                /* Create Account - After Generation */
                <div className="space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
                    <p className="text-white font-medium mb-2 text-sm">
                      Save Your API Key
                    </p>
                    <p className="text-xs text-zinc-500 mb-3">
                      This key will not be shown again. Save it securely.
                    </p>

                    <div className="bg-black border border-zinc-800 p-3 mb-3 rounded">
                      <p className="text-xs text-zinc-600 mb-2">API Key</p>
                      <div className="flex items-center gap-2">
                        <input
                          value={newAccount.api_key}
                          readOnly
                          className="flex-1 bg-zinc-950 border border-zinc-800 px-2 py-1.5 font-mono text-xs text-zinc-300 focus:outline-none rounded"
                        />
                        <Button
                          onClick={copyApiKey}
                          variant={ButtonVariant.Secondary}
                          size={ButtonSize.Small}
                          type="button"
                        >
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 p-2 text-xs text-zinc-400 rounded">
                      <p>
                        <strong className="text-zinc-300">Account ID:</strong>{' '}
                        {newAccount.account_id}
                      </p>
                    </div>
                  </div>

                  {/* Mandatory Confirmation Checkbox */}
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={apiKeyConfirmed}
                        onChange={(e) => setApiKeyConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4"
                      />
                      <span className="text-xs text-zinc-400">
                        I have saved my API key. I understand that I{' '}
                        <strong className="text-zinc-200">
                          cannot recover my data without it
                        </strong>
                        .
                      </span>
                    </label>
                  </div>

                  <Button
                    onClick={loginWithNewKey}
                    disabled={!apiKeyConfirmed || loginMutation.isPending}
                    className="w-full"
                  >
                    {loginMutation.isPending
                      ? 'Logging in...'
                      : 'Continue to Dashboard'}
                  </Button>

                  {!apiKeyConfirmed && (
                    <p className="text-center text-xs text-zinc-600">
                      Confirm you've saved your API key
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
