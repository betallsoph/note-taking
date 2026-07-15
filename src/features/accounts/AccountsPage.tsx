import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  MagnifyingGlass,
  Eye,
  EyeSlash,
  Copy,
  IdentificationCard,
} from '@phosphor-icons/react'
import { api } from '@/services/api'
import {
  PERSONAL_ACCOUNT_CATEGORIES,
  type PersonalAccount,
  type PersonalAccountCategory,
} from '@/types'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

type AccountForm = {
  category: PersonalAccountCategory
  name: string
  username: string
  password: string
  url: string
  notes: string
}

const emptyForm: AccountForm = {
  category: 'other',
  name: '',
  username: '',
  password: '',
  url: '',
  notes: '',
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    // Clipboard may be unavailable; ignore quietly.
  }
}

function categoryLabel(value: string) {
  return PERSONAL_ACCOUNT_CATEGORIES.find((item) => item.value === value)?.label ?? value
}

export function AccountsPage() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PersonalAccount | null>(null)
  const [form, setForm] = useState<AccountForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})
  const queryClient = useQueryClient()

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (categoryFilter !== 'all') params.category = categoryFilter

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts', params],
    queryFn: () => api.accounts.list(Object.keys(params).length ? params : undefined),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['accounts'] })

  const createMutation = useMutation({
    mutationFn: api.accounts.create,
    onSuccess: () => {
      invalidate()
      closeForm()
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not create account'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonalAccount> }) =>
      api.accounts.update(id, data),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not update account'),
  })

  const deleteMutation = useMutation({
    mutationFn: api.accounts.delete,
    onSuccess: invalidate,
  })

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setError(null)
    setFormOpen(true)
  }

  function openEdit(account: PersonalAccount) {
    setEditing(account)
    setForm({
      category: account.category,
      name: account.name,
      username: account.username,
      password: '',
      url: account.url ?? '',
      notes: account.notes ?? '',
    })
    setError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setError(null)
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const payload = {
      category: form.category,
      name: form.name.trim(),
      username: form.username.trim(),
      url: form.url.trim() || null,
      notes: form.notes.trim() || null,
    }

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        data: {
          ...payload,
          ...(form.password ? { password: form.password } : {}),
        },
      })
      return
    }

    if (!form.password) {
      setError('Password is required')
      return
    }
    createMutation.mutate({ ...payload, password: form.password })
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Account
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PERSONAL_ACCOUNT_CATEGORIES.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : accounts?.length === 0 ? (
        <EmptyState
          title="No personal accounts yet"
          description="Store everyday logins here. Keep API keys and DB users in Dev Vault."
          action={
            <Button onClick={openCreate}>
              <IdentificationCard className="h-4 w-4" />
              Add Account
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {accounts?.map((account) => {
            const visible = visibleSecrets[account.id]
            return (
              <div key={account.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-medium">{account.name}</p>
                      <Badge variant="secondary">{categoryLabel(account.category)}</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">User</span>
                        <span className="font-mono">{account.username}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => void copyText(account.username)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">Pass</span>
                        <span className="font-mono">
                          {visible ? account.password : '••••••••••••'}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setVisibleSecrets((prev) => ({
                              ...prev,
                              [account.id]: !prev[account.id],
                            }))
                          }
                        >
                          {visible ? (
                            <EyeSlash className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => void copyText(account.password)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {account.url && (
                        <a
                          href={account.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-primary hover:underline"
                        >
                          {account.url}
                        </a>
                      )}
                      {account.notes && (
                        <p className="text-muted-foreground">{account.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDate(account.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(account)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(account.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeForm()
          else setFormOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Account' : 'New Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <Select
              value={form.category}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, category: value as PersonalAccountCategory }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {PERSONAL_ACCOUNT_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Name (e.g. Personal Gmail)"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <Input
              placeholder="Username / email"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
            <Input
              type="password"
              placeholder={editing ? 'New password (leave blank to keep)' : 'Password'}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required={!editing}
            />
            <Input
              placeholder="URL (optional)"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
            />
            <Textarea
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? 'Save' : 'Create'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
