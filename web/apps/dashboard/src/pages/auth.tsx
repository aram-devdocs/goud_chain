import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth, useCreateAccount, useLogin, useToast } from '@goudchain/hooks'
import { LoginForm } from '@goudchain/ui'
import { validateApiKey } from '@goudchain/utils'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { success, error: showErrorToast } = useToast()
  const createAccountMutation = useCreateAccount()
  const loginMutation = useLogin()
  const [loginError, setLoginError] = useState<string | undefined>(undefined)

  const handleLogin = async (apiKey: string): Promise<void> => {
    try {
      setLoginError(undefined)

      const validation = validateApiKey(apiKey)
      if (!validation.valid) {
        const errorMsg = validation.error ?? 'Invalid API key'
        setLoginError(errorMsg)
        showErrorToast(errorMsg)
        throw new Error(errorMsg)
      }

      localStorage.setItem('api_key', apiKey)

      const result = await loginMutation.mutateAsync({ api_key: apiKey })
      login(result)
      success('Logged in successfully')
      navigate({ to: '/' })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed'
      setLoginError(errorMsg)
      showErrorToast(errorMsg)
      throw err
    }
  }

  const handleCreate = async () => {
    const result = await createAccountMutation.mutateAsync({ metadata: null })
    success('API key generated! Save it securely.')
    return {
      api_key: result.api_key,
      account_id: result.account_id || result.user_id,
    }
  }

  const handleLoginWithNewKey = async (apiKey: string): Promise<void> => {
    localStorage.setItem('api_key', apiKey)

    const result = await loginMutation.mutateAsync({ api_key: apiKey })
    login(result)
    success('Logged in successfully')
    navigate({ to: '/' })
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    success('API key copied to clipboard')
  }

  return (
    <LoginForm
      onLogin={handleLogin}
      onCreate={handleCreate}
      onLoginWithNewKey={handleLoginWithNewKey}
      onCopyToClipboard={handleCopy}
      isLoading={createAccountMutation.isPending || loginMutation.isPending}
      error={loginError}
    />
  )
}
