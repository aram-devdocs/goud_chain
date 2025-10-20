import { useNavigate } from '@tanstack/react-router'
import { useAuth, useCreateAccount, useLogin, useToast } from '@goudchain/hooks'
import { LoginForm } from '@goudchain/ui'
import { validateApiKey } from '@goudchain/utils'

export default function AuthPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { success, error } = useToast()
  const createAccountMutation = useCreateAccount()
  const loginMutation = useLogin()

  const handleLogin = async (apiKey: string): Promise<void> => {
    const validation = validateApiKey(apiKey)
    if (!validation.valid) {
      error(validation.error ?? 'Invalid API key')
      throw new Error(validation.error ?? 'Invalid API key')
    }

    localStorage.setItem('api_key', apiKey)

    const result = await loginMutation.mutateAsync({ api_key: apiKey })
    login(result)
    success('Logged in successfully')
    navigate({ to: '/' })
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
    />
  )
}
