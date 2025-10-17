import { useState } from 'react'
import { useAuth, useCreateAccount, useLogin, useToast } from '@goudchain/hooks'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@goudchain/ui'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [apiKey, setApiKey] = useState('')
  const { login } = useAuth()
  const { success, error } = useToast()
  const createAccountMutation = useCreateAccount()
  const loginMutation = useLogin()

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createAccountMutation.mutateAsync({ username })
      setApiKey(result.api_key)
      success('Account created! Save your API key securely.')
    } catch (err) {
      error((err as Error).message)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await loginMutation.mutateAsync({ api_key: apiKey })
      login(result)
      success('Logged in successfully')
    } catch (err) {
      error((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Goud Chain</CardTitle>
          <p className="text-sm text-zinc-500 mt-2">Encrypted Blockchain Platform</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Button
              variant={isLogin ? 'primary' : 'secondary'}
              onClick={() => setIsLogin(true)}
              className="flex-1"
            >
              Login
            </Button>
            <Button
              variant={!isLogin ? 'primary' : 'secondary'}
              onClick={() => setIsLogin(false)}
              className="flex-1"
            >
              Create Account
            </Button>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createAccountMutation.isPending}>
                {createAccountMutation.isPending ? 'Creating...' : 'Create Account'}
              </Button>
              {apiKey && (
                <div className="mt-4 p-4 bg-yellow-950/50 border border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-400 mb-2 font-semibold">
                    Save this API key securely:
                  </p>
                  <code className="block p-2 bg-black rounded text-xs break-all font-mono text-yellow-300">
                    {apiKey}
                  </code>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
