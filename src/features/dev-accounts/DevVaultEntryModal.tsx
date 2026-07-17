import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, Eye, EyeSlash, PencilSimple, Trash } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/misc'
import {
  credentialLabel,
  environmentLabel,
  isEnvFileKind,
  maskEnvContent,
} from '@/features/dev-accounts/devVaultUtils'
import type { DevAccount } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string | null
  accountId?: string | null
  account?: DevAccount | null
  onEdit?: (projectId: string, account: DevAccount) => void
  onDelete?: (projectId: string, accountId: string) => void
}

async function fetchVaultAccount(accountId: string): Promise<DevAccount | null> {
  try {
    const result = await api.devAccounts.getAccount(accountId)
    return result.account
  } catch {
    const projects = await api.devAccounts.listProjects()
    for (const project of projects) {
      const entry = project.accounts?.find((row) => row.id === accountId)
      if (entry) return entry
    }
    return null
  }
}

export function DevVaultEntryModal({
  open,
  onOpenChange,
  projectId,
  accountId,
  account: accountProp,
  onEdit,
  onDelete,
}: Props) {
  const navigate = useNavigate()
  const [reveal, setReveal] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const shouldFetch = open && Boolean(accountId) && !accountProp

  const { data: fetchedAccount, isLoading } = useQuery({
    queryKey: ['dev-account', accountId],
    queryFn: () => fetchVaultAccount(accountId!),
    enabled: shouldFetch,
  })

  const account = accountProp ?? fetchedAccount ?? null
  const resolvedProjectId = projectId ?? account?.projectId ?? null
  const envFile = isEnvFileKind(account?.kind)

  useEffect(() => {
    if (!open) {
      setReveal(false)
      setCopiedKey(null)
    }
  }, [open])

  useEffect(() => {
    if (!copiedKey) return
    const timer = window.setTimeout(() => setCopiedKey(null), 1200)
    return () => window.clearTimeout(timer)
  }, [copiedKey])

  async function copyText(value: string, key?: string) {
    try {
      await navigator.clipboard.writeText(value)
      if (key) setCopiedKey(key)
    } catch {
      // Clipboard may be unavailable.
    }
  }

  function openInDevVault() {
    if (!resolvedProjectId || !account?.id) return
    onOpenChange(false)
    navigate(`/dev-accounts?project=${resolvedProjectId}&account=${account.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {account ? (
              <span className="flex flex-wrap items-center gap-2 pr-8">
                <span>{account.name}</span>
                <Badge variant="secondary">{credentialLabel(account.kind)}</Badge>
                <Badge variant="outline">{environmentLabel(account.environment)}</Badge>
                {account.provider && <Badge variant="outline">{account.provider}</Badge>}
              </span>
            ) : (
              'Dev Vault entry'
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading && !account ? (
          <Skeleton className="h-40" />
        ) : !account ? (
          <p className="text-sm text-muted-foreground">
            This vault entry could not be found. It may have been deleted.
          </p>
        ) : (
          <div className="space-y-4">
            {envFile ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground opacity-70">
                    Contents
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7"
                    onClick={() => copyText(account.password, `copy-all:${account.id}`)}
                  >
                    {copiedKey === `copy-all:${account.id}` ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy all
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setReveal((prev) => !prev)}
                    title={reveal ? 'Hide .env' : 'Show .env'}
                  >
                    {reveal ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <pre className="max-h-[40vh] overflow-auto rounded-md bg-muted/50 p-3 font-mono text-xs leading-relaxed text-foreground">
                  {reveal ? account.password : maskEnvContent(account.password)}
                </pre>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground opacity-70">
                    Identifier
                  </span>
                  <span className="truncate font-mono">{account.username}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyText(account.username, `user:${account.id}`)}
                  >
                    {copiedKey === `user:${account.id}` ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground opacity-70">
                    Value
                  </span>
                  <span className="min-w-0 flex-1 break-all font-mono">
                    {reveal ? account.password : '••••••••••••'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setReveal((prev) => !prev)}
                  >
                    {reveal ? <EyeSlash className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyText(account.password, `pass:${account.id}`)}
                  >
                    {copiedKey === `pass:${account.id}` ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                {account.url && (
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground opacity-70">
                      URL
                    </span>
                    <span className="truncate font-mono">{account.url}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyText(account.url ?? '', `url:${account.id}`)}
                    >
                      {copiedKey === `url:${account.id}` ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {account.description && (
              <p className="text-sm text-muted-foreground">{account.description}</p>
            )}

            <div className="flex flex-wrap gap-2 border-t pt-3">
              <Button type="button" onClick={openInDevVault} disabled={!resolvedProjectId}>
                Open in Dev Vault
              </Button>
              {onEdit && resolvedProjectId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onEdit(resolvedProjectId, account)
                    onOpenChange(false)
                  }}
                >
                  <PencilSimple className="h-4 w-4" /> Edit
                </Button>
              )}
              {onDelete && resolvedProjectId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!confirm(`Delete entry "${account.name}"?`)) return
                    onDelete(resolvedProjectId, account.id)
                    onOpenChange(false)
                  }}
                >
                  <Trash className="h-4 w-4" /> Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
