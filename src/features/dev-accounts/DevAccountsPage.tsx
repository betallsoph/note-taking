import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  PencilSimple,
  Trash,
  Eye,
  EyeSlash,
  Copy,
  FolderSimple,
  Key,
} from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { DevAccount, DevCredentialKind, DevProject } from '@/types'

type ProjectForm = { name: string; description: string }
type AccountForm = {
  kind: DevCredentialKind
  provider: string
  environment: string
  name: string
  username: string
  password: string
  url: string
  description: string
}

const NEW_PROJECT_VALUE = '__new__'
const emptyProject: ProjectForm = { name: '', description: '' }
const emptyAccount: AccountForm = {
  kind: 'api_key',
  provider: '',
  environment: 'dev',
  name: '',
  username: '',
  password: '',
  url: '',
  description: '',
}

const credentialTypes: Array<{ value: DevCredentialKind; label: string }> = [
  { value: 'api_key', label: 'API Key' },
  { value: 'database', label: 'Database User' },
  { value: 'connection_string', label: 'Connection String' },
  { value: 'login', label: 'Login' },
  { value: 'oauth_client', label: 'OAuth Client' },
  { value: 'webhook_secret', label: 'Webhook Secret' },
  { value: 'ssh_key', label: 'SSH Key' },
  { value: 'env_var', label: 'Env Var' },
]

const environments = ['dev', 'local', 'staging', 'qa', 'prod', 'sandbox'] as const

function credentialLabel(kind?: string) {
  return credentialTypes.find((item) => item.value === kind)?.label ?? 'Secret'
}

function environmentLabel(value?: string) {
  return value ? value.toUpperCase() : 'DEV'
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    // Clipboard may be unavailable in some environments; ignore quietly.
  }
}

export function DevAccountsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<DevProject | null>(null)
  const [editingAccount, setEditingAccount] = useState<DevAccount | null>(null)
  const [projectChoice, setProjectChoice] = useState<string>(NEW_PROJECT_VALUE)
  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProject)
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccount)
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['dev-accounts'],
    queryFn: api.devAccounts.listProjects,
  })

  const vaultStats = useMemo(() => {
    const projectCount = projects?.length ?? 0
    const secretCount = projects?.reduce((sum, project) => sum + (project.accounts?.length ?? 0), 0) ?? 0
    return { projectCount, secretCount }
  }, [projects])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dev-accounts'] })

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DevProject> }) =>
      api.devAccounts.updateProject(id, data),
    onSuccess: () => {
      invalidate()
      closeEditProjectDialog()
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: api.devAccounts.deleteProject,
    onSuccess: invalidate,
  })

  const updateAccountMutation = useMutation({
    mutationFn: ({
      projectId,
      accountId,
      data,
    }: {
      projectId: string
      accountId: string
      data: Partial<DevAccount>
    }) => api.devAccounts.updateAccount(projectId, accountId, data),
    onSuccess: () => {
      invalidate()
      closeFormDialog()
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: ({ projectId, accountId }: { projectId: string; accountId: string }) =>
      api.devAccounts.deleteAccount(projectId, accountId),
    onSuccess: invalidate,
  })

  const creatingNewProject = !editingAccount && projectChoice === NEW_PROJECT_VALUE

  function closeFormDialog() {
    setFormOpen(false)
    setEditingAccount(null)
    setProjectChoice(NEW_PROJECT_VALUE)
    setProjectForm(emptyProject)
    setAccountForm(emptyAccount)
    setSubmitting(false)
  }

  function closeEditProjectDialog() {
    setEditProjectOpen(false)
    setEditingProject(null)
    setProjectForm(emptyProject)
  }

  function openAddForm(preferredProjectId?: string) {
    setEditingAccount(null)
    setAccountForm(emptyAccount)
    setProjectForm(emptyProject)

    if (preferredProjectId) {
      setProjectChoice(preferredProjectId)
    } else if (projects && projects.length > 0) {
      setProjectChoice(projects[0].id)
    } else {
      setProjectChoice(NEW_PROJECT_VALUE)
    }

    setFormOpen(true)
  }

  function openEditAccount(projectId: string, account: DevAccount) {
    setEditingAccount(account)
    setProjectChoice(projectId)
    setProjectForm(emptyProject)
    setAccountForm({
      kind: account.kind ?? 'login',
      provider: account.provider ?? '',
      environment: account.environment ?? 'dev',
      name: account.name,
      username: account.username,
      password: account.password,
      url: account.url ?? '',
      description: account.description ?? '',
    })
    setFormOpen(true)
  }

  function openEditProject(project: DevProject) {
    setEditingProject(project)
    setProjectForm({
      name: project.name,
      description: project.description ?? '',
    })
    setEditProjectOpen(true)
  }

  function submitEditProject(e: React.FormEvent) {
    e.preventDefault()
    if (!editingProject) return
    updateProjectMutation.mutate({
      id: editingProject.id,
      data: {
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || null,
      },
    })
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    const accountPayload = {
      kind: accountForm.kind,
      provider: accountForm.provider.trim() || null,
      environment: accountForm.environment,
      name: accountForm.name.trim(),
      username: accountForm.username.trim(),
      password: accountForm.password,
      url: accountForm.url.trim() || null,
      description: accountForm.description.trim() || null,
    }

    if (editingAccount) {
      updateAccountMutation.mutate({
        projectId: projectChoice,
        accountId: editingAccount.id,
        data: accountPayload,
      })
      return
    }

    setSubmitting(true)
    try {
      let projectId = projectChoice
      if (creatingNewProject) {
        const name = projectForm.name.trim()
        if (!name) {
          setSubmitting(false)
          return
        }
        const project = await api.devAccounts.createProject({
          name,
          description: projectForm.description.trim() || null,
        })
        projectId = project.id
      }

      await api.devAccounts.createAccount(projectId, accountPayload)
      await invalidate()
      closeFormDialog()
    } catch {
      setSubmitting(false)
    }
  }

  function toggleSecret(accountId: string) {
    setVisibleSecrets((prev) => ({ ...prev, [accountId]: !prev[accountId] }))
  }

  const formBusy = submitting || updateAccountMutation.isPending

  return (
    <div>
      <PageHeader
        title="Dev Vault"
        actions={
          <Button onClick={() => openAddForm()}>
            <Plus className="h-4 w-4" /> New Secret
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <Badge variant="secondary">{vaultStats.projectCount} projects</Badge>
        <Badge variant="secondary">{vaultStats.secretCount} secrets</Badge>
        <Badge variant="outline">Grouped by project</Badge>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : projects?.length === 0 ? (
        <EmptyState
          title="No project secrets yet"
          description="Create a project and store the first API key, database user, or connection string."
          action={<Button onClick={() => openAddForm()}>Add Secret</Button>}
        />
      ) : (
        <div className="space-y-6">
          {projects?.map((project) => (
            <Card key={project.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <FolderSimple className="h-5 w-5 shrink-0 text-muted-foreground" weight="duotone" />
                    <span className="truncate">{project.name}</span>
                  </CardTitle>
                  {project.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project.accounts?.length ?? 0} secret
                    {(project.accounts?.length ?? 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => openAddForm(project.id)}>
                    <Plus className="h-4 w-4" /> Secret
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditProject(project)}>
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Delete project "${project.name}" and every secret inside it?`)) {
                        deleteProjectMutation.mutate(project.id)
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {(project.accounts?.length ?? 0) === 0 ? (
                  <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                    No secrets yet. Add the first API key, DB user, or connection string for this project.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {project.accounts?.map((account) => {
                      const showSecret = visibleSecrets[account.id]
                      return (
                        <div key={account.id} className="rounded-md border px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Key className="h-4 w-4 shrink-0 text-muted-foreground" weight="duotone" />
                                <p className="font-medium">{account.name}</p>
                                <Badge variant="secondary">{credentialLabel(account.kind)}</Badge>
                                <Badge variant="outline">{environmentLabel(account.environment)}</Badge>
                                {account.provider && <Badge variant="outline">{account.provider}</Badge>}
                              </div>

                              <div className="grid gap-2 text-sm text-muted-foreground lg:grid-cols-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="shrink-0 text-xs uppercase tracking-wide opacity-70">
                                    Identifier
                                  </span>
                                  <span className="truncate font-mono text-foreground">
                                    {account.username}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => copyText(account.username)}
                                    title="Copy identifier"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="shrink-0 text-xs uppercase tracking-wide opacity-70">
                                    Secret
                                  </span>
                                  <span className="truncate font-mono text-foreground">
                                    {showSecret ? account.password : '••••••••••••'}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => toggleSecret(account.id)}
                                    title={showSecret ? 'Hide secret' : 'Show secret'}
                                  >
                                    {showSecret ? (
                                      <EyeSlash className="h-3.5 w-3.5" />
                                    ) : (
                                      <Eye className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => copyText(account.password)}
                                    title="Copy secret"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {account.url && (
                                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                                  <span className="shrink-0 text-xs uppercase tracking-wide opacity-70">
                                    URL
                                  </span>
                                  <span className="truncate font-mono text-foreground">{account.url}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => copyText(account.url ?? '')}
                                    title="Copy URL"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}

                              {account.description && (
                                <p className="text-sm text-muted-foreground">{account.description}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditAccount(project.id, account)}
                              >
                                <PencilSimple className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm(`Delete secret "${account.name}"?`)) {
                                    deleteAccountMutation.mutate({
                                      projectId: project.id,
                                      accountId: account.id,
                                    })
                                  }
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeFormDialog()
          else setFormOpen(true)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Secret' : 'New Secret'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            {!editingAccount && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={projectChoice} onValueChange={setProjectChoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose project" />
                    </SelectTrigger>
                    <SelectContent>
                      {(projects ?? []).map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={NEW_PROJECT_VALUE}>+ Create new project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {creatingNewProject && (
                  <div className="space-y-3 rounded-md border border-dashed p-3">
                    <Input
                      placeholder="New project name"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                    <Textarea
                      placeholder="Project notes, stack, links, or purpose"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={accountForm.kind}
                  onValueChange={(value) =>
                    setAccountForm((form) => ({ ...form, kind: value as DevCredentialKind }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {credentialTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Environment</label>
                <Select
                  value={accountForm.environment}
                  onValueChange={(value) => setAccountForm((form) => ({ ...form, environment: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {environments.map((env) => (
                      <SelectItem key={env} value={env}>
                        {environmentLabel(env)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Provider (MongoDB Atlas, Neon, Stripe)"
                value={accountForm.provider}
                onChange={(e) => setAccountForm((f) => ({ ...f, provider: e.target.value }))}
              />
              <Input
                placeholder="Console URL or docs URL"
                value={accountForm.url}
                onChange={(e) => setAccountForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Name (Atlas database user, Stripe secret key)"
                value={accountForm.name}
                onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Identifier (username, key id, env var name)"
                value={accountForm.username}
                onChange={(e) => setAccountForm((f) => ({ ...f, username: e.target.value }))}
                required
              />
              <Input
                placeholder="Secret value / password / connection string"
                value={accountForm.password}
                onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <Textarea
                placeholder="Notes: IP allowlist, role, created by, rotation date, usage"
                value={accountForm.description}
                onChange={(e) => setAccountForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={formBusy}>
              {editingAccount ? 'Save secret' : creatingNewProject ? 'Create project & secret' : 'Create secret'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editProjectOpen}
        onOpenChange={(open) => {
          if (!open) closeEditProjectDialog()
          else setEditProjectOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEditProject} className="space-y-4">
            <Input
              placeholder="Project name"
              value={projectForm.name}
              onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Textarea
              placeholder="Project notes, stack, links, or purpose"
              value={projectForm.description}
              onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Button type="submit" className="w-full" disabled={updateProjectMutation.isPending}>
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
