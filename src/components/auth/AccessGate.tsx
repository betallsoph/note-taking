import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { LockKey } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError, api, clearAccessToken, setAccessToken } from '@/services/api'
import { useAuthStore, useUIStore } from '@/store'

export function AccessGate({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const theme = useUIStore((s) => s.theme)
  const [status, setStatus] = useState<'checking' | 'locked' | 'ready'>('checking')
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)

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
        setStatus('ready')
      })
  }, [setUser])

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) return

    setError(null)
    setAccessToken(trimmed)

    try {
      const user = await api.auth.me()
      setUser(user)
      setStatus('ready')
    } catch (err) {
      clearAccessToken()
      setError(err instanceof Error ? err.message : 'Could not unlock workspace')
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
          onSubmit={unlock}
          className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LockKey className="h-5 w-5" weight="bold" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Private CS Hub</h1>
              <p className="text-sm text-muted-foreground">Enter your access token</p>
            </div>
          </div>
          <Input
            autoFocus
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Access token"
          />
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
          <Button className="mt-4 w-full" type="submit">
            Unlock
          </Button>
        </form>
      </main>
    )
  }

  return children
}
