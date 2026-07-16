import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError, api, clearAccessToken, setAccessToken } from '@/services/api'
import { useAuthStore, useUIStore } from '@/store'

type AuthMode = 'login' | 'register'

export function AccessGate({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const theme = useUIStore((s) => s.theme)
  const [status, setStatus] = useState<'checking' | 'locked' | 'ready'>('checking')
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    api.auth
      .me()
      .then((user) => {
        setUser(user)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          clearAccessToken()
          setStatus('locked')
          return
        }
        setStatus('locked')
      })
  }, [setUser])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedUsername = username.trim()
    if (!trimmedUsername || !password) return

    setError(null)
    setSubmitting(true)

    try {
      const payload =
        mode === 'login'
          ? await api.auth.login({ username: trimmedUsername, password })
          : await api.auth.register({
              username: trimmedUsername,
              password,
              name: displayName.trim() || undefined,
            })

      setAccessToken(payload.token)
      setUser(payload.user)
      setStatus('ready')
    } catch (err) {
      clearAccessToken()
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'checking') {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-background px-6 text-sm text-muted-foreground">
        Opening workspace...
      </div>
    )
  }

  if (status === 'locked') {
    return (
      <main className="grid min-h-[100dvh] place-items-center bg-background px-6">
        <form
          onSubmit={submit}
          className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm"
        >
          <div className="mb-5">
            <h1 className="text-lg font-semibold">CS Hub</h1>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          <div className="space-y-3">
            <Input
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
            />
            {mode === 'register' ? (
              <Input
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display name (optional)"
              />
            ) : null}
            <Input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
          </div>

          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

          <Button className="mt-4 w-full" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </form>
      </main>
    )
  }

  return children
}
