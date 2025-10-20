import { useState } from 'react'
import {
  Button,
  Input,
  Label,
  Checkbox,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ButtonGroup,
} from '../index'
import { ButtonVariant, ButtonSize } from '@goudchain/types'
import { validateApiKey } from '@goudchain/utils'

export interface LoginFormProps {
  onLogin: (apiKey: string) => Promise<void>
  onCreate: (metadata: null) => Promise<{
    api_key: string
    account_id: string
    user_id?: string
  }>
  onLoginWithNewKey: (apiKey: string) => Promise<void>
  onCopyToClipboard?: (text: string) => void
  isLoading?: boolean
  error?: string
}

export function LoginForm({
  onLogin,
  onCreate,
  onLoginWithNewKey,
  onCopyToClipboard,
  isLoading = false,
  error,
}: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const [newAccount, setNewAccount] = useState<{
    api_key: string
    account_id: string
  } | null>(null)
  const [apiKeyConfirmed, setApiKeyConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCreateAccount = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()

    const result = await onCreate(null)
    setNewAccount({
      api_key: result.api_key,
      account_id: result.account_id || result.user_id || '',
    })
  }

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault()
    await onLogin(apiKey.trim())
  }

  const handleLoginWithNewKey = async (): Promise<void> => {
    if (!newAccount || !apiKeyConfirmed) return
    await onLoginWithNewKey(newAccount.api_key)
  }

  const validateApiKeyOnBlur = (): void => {
    if (!apiKey) {
      setApiKeyError(null)
      return
    }

    const validation = validateApiKey(apiKey)
    if (!validation.valid) {
      setApiKeyError(validation.error ?? 'Invalid API key')
    } else {
      setApiKeyError(null)
    }
  }

  const copyApiKey = (): void => {
    if (!newAccount) return

    if (onCopyToClipboard) {
      onCopyToClipboard(newAccount.api_key)
    } else {
      navigator.clipboard.writeText(newAccount.api_key)
    }

    setCopied(true)
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
          <ButtonGroup direction="horizontal" spacing="tight" className="mb-6">
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
          </ButtonGroup>

          {error && (
            <div className="mb-4 bg-red-900/20 border border-red-700 p-3 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Login Tab */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setApiKey(e.target.value)
                    // Clear error when user starts typing
                    if (apiKeyError) setApiKeyError(null)
                  }}
                  onBlur={validateApiKeyOnBlur}
                  placeholder="Paste your API key"
                  required
                  error={!!apiKeyError}
                  className="mt-1 font-mono text-sm"
                />
                {apiKeyError ? (
                  <p className="text-xs text-red-400 mt-1">{apiKeyError}</p>
                ) : (
                  <p className="text-xs text-zinc-500 mt-1">
                    64-character hexadecimal string
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !apiKey}
                loading={isLoading}
              >
                Login
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
                    disabled={isLoading}
                    loading={isLoading}
                  >
                    Generate API Key
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
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-3">
                      <Checkbox
                        id="confirm-saved"
                        checked={apiKeyConfirmed}
                        onChange={(e) => setApiKeyConfirmed(e.target.checked)}
                        label={
                          <span className="text-xs text-zinc-400">
                            I have saved my API key. I understand that I{' '}
                            <strong className="text-zinc-200">
                              cannot recover my data without it
                            </strong>
                            .
                          </span>
                        }
                      />
                    </CardContent>
                  </Card>

                  <Button
                    onClick={handleLoginWithNewKey}
                    disabled={!apiKeyConfirmed || isLoading}
                    loading={isLoading}
                    className="w-full"
                  >
                    Continue to Dashboard
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
