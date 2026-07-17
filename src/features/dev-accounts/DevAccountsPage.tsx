import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  PencilSimple,
  Trash,
  FolderSimple,
  Key,
  FileText,
  ArrowLeft,
  CaretRight,
} from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DevVaultEntryModal } from './DevVaultEntryModal'
import {
  credentialLabel,
  credentialTypes,
  defaultEnvFileName,
  entryCountLabel,
  environmentLabel,
  environments,
  isEnvFileKind,
  usesMultilineSecret,
} from './devVaultUtils'
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

export function DevAccountsPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const deepLinkHandled = useRef(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [viewingAccount, setViewingAccount] = useState<DevAccount | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editProjectOpen, setEditProjectOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<DevProject | null>(null)
  const [editingAccount, setEditingAccount] = useState<DevAccount | null>(null)
  const [projectChoice, setProjectChoice] = useState<string>(NEW_PROJECT_VALUE)
  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProject)
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccount)
  const [submitting, setSubmitting] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['dev-accounts'],
    queryFn: api.devAccounts.listProjects,
  })

  const selectedProject = useMemo(
    () => projects?.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  )

  const viewingAccountLive = useMemo(() => {
    if (!viewingAccount || !selectedProject) return null
    return selectedProject.accounts?.find((account) => account.id === viewingAccount.id) ?? null
  }, [viewingAccount, selectedProject])

  const vaultStats = useMemo(() => {
    const projectCount = projects?.length ?? 0
    const entryCount = projects?.reduce((sum, project) => sum + (project.accounts?.length ?? 0), 0) ?? 0
    return { projectCount, entryCount }
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
    onSuccess: (_data, projectId) => {
      if (selectedProjectId === projectId) setSelectedProjectId(null)
      invalidate()
    },
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
  const envFileForm = isEnvFileKind(accountForm.kind)

  useEffect(() => {
    if (deepLinkHandled.current || isLoading || !projects) return

    const projectParam = searchParams.get('project')
    const accountParam = searchParams.get('account')
    if (!projectParam) return

    const project = projects.find((row) => row.id === projectParam)
    if (!project) return

    deepLinkHandled.current = true
    setSelectedProjectId(projectParam)

    if (accountParam) {
      const account = project.accounts?.find((row) => row.id === accountParam)
      if (account) setViewingAccount(account)
    }
  }, [isLoading, projects, searchParams])

  useEffect(() => {
    if (selectedProjectId && projects && !selectedProject && !isLoading) {
      setSelectedProjectId(null)
    }
  }, [selectedProjectId, projects, selectedProject, isLoading])

  function closeViewDialog() {
    setViewingAccount(null)
  }

  function openViewAccount(account: DevAccount) {
    setViewingAccount(account)
  }

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

  function openAddForm(preferredProjectId?: string, options?: { kind?: DevCredentialKind }) {
    setEditingAccount(null)
    const kind = options?.kind ?? 'api_key'
    const environment = isEnvFileKind(kind) ? 'prod' : 'dev'
    setAccountForm({
      ...emptyAccount,
      kind,
      environment,
      name: isEnvFileKind(kind) ? defaultEnvFileName(environment) : '',
      username: isEnvFileKind(kind) ? '.env' : '',
    })
    setProjectForm(emptyProject)

    if (preferredProjectId) {
      setProjectChoice(preferredProjectId)
    } else if (selectedProjectId) {
      setProjectChoice(selectedProjectId)
    } else if (projects && projects.length > 0) {
      setProjectChoice(projects[0].id)
    } else {
      setProjectChoice(NEW_PROJECT_VALUE)
    }

    setFormOpen(true)
  }

  function openEditAccount(projectId: string, account: DevAccount) {
    closeViewDialog()
    setEditingAccount(account)
    setProjectChoice(projectId)
    setProjectForm(emptyProject)
    const kind = isEnvFileKind(account.kind) ? 'env_file' : (account.kind ?? 'login')
    setAccountForm({
      kind,
      provider: account.provider ?? '',
      environment: account.environment ?? 'dev',
      name: account.name,
      username: isEnvFileKind(kind) ? '.env' : account.username,
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

  function openNewProjectOnly() {
    setEditingProject(null)
    setProjectForm(emptyProject)
    setEditProjectOpen(true)
  }

  function submitEditProject(e: React.FormEvent) {
    e.preventDefault()
    if (editingProject) {
      updateProjectMutation.mutate({
        id: editingProject.id,
        data: {
          name: projectForm.name.trim(),
          description: projectForm.description.trim() || null,
        },
      })
      return
    }

    const name = projectForm.name.trim()
    if (!name) return
    void (async () => {
      const project = await api.devAccounts.createProject({
        name,
        description: projectForm.description.trim() || null,
      })
      await invalidate()
      closeEditProjectDialog()
      setSelectedProjectId(project.id)
    })()
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    const envFile = isEnvFileKind(accountForm.kind)
    const accountPayload = {
      kind: envFile ? 'env_file' : accountForm.kind,
      provider: envFile ? null : accountForm.provider.trim() || null,
      environment: accountForm.environment,
      name: envFile
        ? accountForm.name.trim() || defaultEnvFileName(accountForm.environment)
        : accountForm.name.trim(),
      username: envFile ? '.env' : accountForm.username.trim(),
      password: accountForm.password,
      url: envFile ? null : accountForm.url.trim() || null,
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
        setSelectedProjectId(project.id)
      }

      await api.devAccounts.createAccount(projectId, accountPayload)
      setSelectedProjectId(projectId)
      await invalidate()
      closeFormDialog()
    } catch {
      setSubmitting(false)
    }
  }

  const formBusy = submitting || updateAccountMutation.isPending
  const viewingProject = Boolean(selectedProject)
  const modalAccount = viewingAccountLive ?? viewingAccount

  useEffect(() => {
    if (viewingAccount && selectedProject && !viewingAccountLive) {
      closeViewDialog()
    }
  }, [viewingAccount, selectedProject, viewingAccountLive])

  return (
    <div>
      <PageHeader
        title={
          viewingProject && selectedProject ? (
            <span className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-ml-2"
                onClick={() => {
                  closeViewDialog()
                  setSelectedProjectId(null)
                }}
                title="Back to projects"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="truncate">{selectedProject.name}</span>
            </span>
          ) : (
            'Dev Vault'
          )
        }
        actions={
          viewingProject && selectedProject ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => openAddForm(selectedProject.id, { kind: 'env_file' })}
              >
                <FileText className="h-4 w-4" /> Paste .env
              </Button>
              <Button onClick={() => openAddForm(selectedProject.id)}>
                <Plus className="h-4 w-4" /> New entry
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => openAddForm(undefined, { kind: 'env_file' })}>
                <FileText className="h-4 w-4" /> Paste .env
              </Button>
              <Button onClick={openNewProjectOnly}>
                <Plus className="h-4 w-4" /> New project
              </Button>
            </div>
          )
        }
      />

      {!viewingProject && (
        <div className="mb-5 flex flex-wrap gap-2">
          <Badge variant="secondary">{vaultStats.projectCount} projects</Badge>
          <Badge variant="secondary">{vaultStats.entryCount} entries</Badge>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : viewingProject && selectedProject ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {selectedProject.description && (
                <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {entryCountLabel(selectedProject.accounts?.length ?? 0)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEditProject(selectedProject)}>
                <PencilSimple className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (
                    confirm(`Delete project "${selectedProject.name}" and every entry inside it?`)
                  ) {
                    deleteProjectMutation.mutate(selectedProject.id)
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {(selectedProject.accounts?.length ?? 0) === 0 ? (
            <EmptyState
              title="No entries yet"
              description="Paste a full .env block for this project, or add a single API key / login if you need one."
              action={
                <Button onClick={() => openAddForm(selectedProject.id, { kind: 'env_file' })}>
                  Paste .env
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {selectedProject.accounts?.map((account) => {
                const envFile = isEnvFileKind(account.kind)
                return (
                  <div
                    key={account.id}
                    className="flex items-center gap-2 rounded-md border transition-colors hover:bg-muted/50"
                  >
                    <button
                      type="button"
                      onClick={() => openViewAccount(account)}
                      className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left"
                    >
                      {envFile ? (
                        <FileText
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          weight="duotone"
                        />
                      ) : (
                        <Key className="h-4 w-4 shrink-0 text-muted-foreground" weight="duotone" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{account.name}</p>
                          <Badge variant="secondary">{credentialLabel(account.kind)}</Badge>
                          <Badge variant="outline">{environmentLabel(account.environment)}</Badge>
                          {account.provider && <Badge variant="outline">{account.provider}</Badge>}
                        </div>
                        {account.description ? (
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {account.description}
                          </p>
                        ) : null}
                      </div>
                      <CaretRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                    <div className="flex shrink-0 items-center gap-1 pr-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          closeViewDialog()
                          openEditAccount(selectedProject.id, account)
                        }}
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete entry "${account.name}"?`)) {
                            deleteAccountMutation.mutate({
                              projectId: selectedProject.id,
                              accountId: account.id,
                            })
                          }
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : projects?.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create a project and paste its .env block, or add individual credentials later."
          action={
            <Button onClick={() => openAddForm(undefined, { kind: 'env_file' })}>Paste .env</Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {projects?.map((project) => {
            const count = project.accounts?.length ?? 0
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className="flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <FolderSimple
                  className="h-5 w-5 shrink-0 text-muted-foreground"
                  weight="duotone"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{project.name}</p>
                  {project.description ? (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  ) : null}
                  <p className="mt-0.5 text-xs text-muted-foreground">{entryCountLabel(count)}</p>
                </div>
                <CaretRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            )
          })}
        </div>
      )}

      <DevVaultEntryModal
        open={Boolean(modalAccount)}
        onOpenChange={(open) => {
          if (!open) closeViewDialog()
        }}
        account={modalAccount}
        projectId={selectedProject?.id ?? null}
        accountId={modalAccount?.id ?? null}
        onEdit={(projectId, account) => openEditAccount(projectId, account)}
        onDelete={(projectId, accountId) => {
          deleteAccountMutation.mutate({ projectId, accountId })
          closeViewDialog()
        }}
      />

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) closeFormDialog()
          else setFormOpen(true)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAccount
                ? envFileForm
                  ? 'Edit .env file'
                  : 'Edit entry'
                : envFileForm
                  ? 'Paste .env file'
                  : 'New entry'}
            </DialogTitle>
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
                  </div>
                )}
              </div>
            )}

            {envFileForm ? (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Environment</label>
                <Select
                  value={accountForm.environment}
                  onValueChange={(value) =>
                    setAccountForm((form) => ({
                      ...form,
                      environment: value,
                      name: defaultEnvFileName(value),
                    }))
                  }
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
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={accountForm.kind}
                      onValueChange={(value) => {
                        const kind = value as DevCredentialKind
                        setAccountForm((form) => ({
                          ...form,
                          kind,
                        }))
                      }}
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
                      onValueChange={(value) =>
                        setAccountForm((form) => ({ ...form, environment: value }))
                      }
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
              </>
            )}

            <div className="space-y-3">
              {!envFileForm && (
                <>
                  <Input
                    placeholder="Name (Atlas database user, Stripe secret key)"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Identifier (username, key id)"
                    value={accountForm.username}
                    onChange={(e) => setAccountForm((f) => ({ ...f, username: e.target.value }))}
                    required
                  />
                  {usesMultilineSecret(accountForm.kind) ? (
                    <Textarea
                      placeholder={
                        accountForm.kind === 'ssh_key'
                          ? 'Paste SSH private key'
                          : 'Paste connection string'
                      }
                      value={accountForm.password}
                      onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))}
                      className="min-h-32 font-mono text-xs leading-relaxed"
                      required
                      spellCheck={false}
                    />
                  ) : (
                    <Input
                      placeholder="Secret value / password"
                      value={accountForm.password}
                      onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))}
                      required
                    />
                  )}
                </>
              )}

              {envFileForm && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Paste full .env block</label>
                  <Textarea
                    placeholder={`DATABASE_URL=postgresql://...\nMONGODB_URI=mongodb+srv://...\nACCESS_TOKEN=...`}
                    value={accountForm.password}
                    onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))}
                    className="min-h-56 font-mono text-xs leading-relaxed"
                    required
                    spellCheck={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste the whole block from your IDE or Vercel. Use Copy all later to paste it
                    elsewhere.
                  </p>
                </div>
              )}

              <Textarea
                placeholder={
                  envFileForm
                    ? 'Notes (optional): which deploy, last rotated, etc.'
                    : 'Notes (optional): IP allowlist, role, rotation date'
                }
                value={accountForm.description}
                onChange={(e) => setAccountForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={formBusy}>
              {editingAccount
                ? 'Save'
                : creatingNewProject
                  ? envFileForm
                    ? 'Create project & save .env'
                    : 'Create project & entry'
                  : envFileForm
                    ? 'Save .env'
                    : 'Create entry'}
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
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEditProject} className="space-y-4">
            <Input
              placeholder="Project name"
              value={projectForm.name}
              onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Textarea
              placeholder="Project notes, stack, links, or purpose (optional)"
              value={projectForm.description}
              onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Button type="submit" className="w-full" disabled={updateProjectMutation.isPending}>
              {editingProject ? 'Save' : 'Create project'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
