import { useState } from 'react'
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
import type { DevAccount, DevProject } from '@/types'

type ProjectForm = { name: string; description: string }
type AccountForm = { name: string; username: string; password: string; description: string }

const NEW_PROJECT_VALUE = '__new__'
const emptyProject: ProjectForm = { name: '', description: '' }
const emptyAccount: AccountForm = { name: '', username: '', password: '', description: '' }

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
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['dev-accounts'],
    queryFn: api.devAccounts.listProjects,
  })

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
      name: account.name,
      username: account.username,
      password: account.password,
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
      name: accountForm.name.trim(),
      username: accountForm.username.trim(),
      password: accountForm.password,
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

  function togglePassword(accountId: string) {
    setVisiblePasswords((prev) => ({ ...prev, [accountId]: !prev[accountId] }))
  }

  const formBusy = submitting || updateAccountMutation.isPending

  return (
    <div>
      <PageHeader
        title="Dev Accounts"
        description="Lưu account theo từng project — tên, mail/username, password, mô tả"
        actions={
          <Button onClick={() => openAddForm()}>
            <Plus className="h-4 w-4" /> New Account
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : projects?.length === 0 ? (
        <EmptyState
          title="Chưa có account nào"
          description="Thêm account — có thể tạo project mới ngay trong form."
          action={<Button onClick={() => openAddForm()}>Add Account</Button>}
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
                    {project.accounts?.length ?? 0} account
                    {(project.accounts?.length ?? 0) === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => openAddForm(project.id)}>
                    <Plus className="h-4 w-4" /> Account
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEditProject(project)}>
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm(`Xóa project "${project.name}" và toàn bộ account bên trong?`)) {
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
                    Chưa có account. Thêm account đầu tiên cho project này.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {project.accounts?.map((account) => {
                      const showPassword = visiblePasswords[account.id]
                      return (
                        <div key={account.id} className="rounded-md border px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <Key className="h-4 w-4 shrink-0 text-muted-foreground" weight="duotone" />
                                <p className="font-medium">{account.name}</p>
                              </div>
                              <div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                                <div className="flex items-center gap-2">
                                  <span className="shrink-0 text-xs uppercase tracking-wide opacity-70">
                                    User
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
                                    title="Copy username"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="shrink-0 text-xs uppercase tracking-wide opacity-70">
                                    Pass
                                  </span>
                                  <span className="truncate font-mono text-foreground">
                                    {showPassword ? account.password : '••••••••'}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => togglePassword(account.id)}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                  >
                                    {showPassword ? (
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
                                    title="Copy password"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
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
                                  if (confirm(`Xóa account "${account.name}"?`)) {
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            {!editingAccount && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Project</label>
                  <Select value={projectChoice} onValueChange={setProjectChoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn project" />
                    </SelectTrigger>
                    <SelectContent>
                      {(projects ?? []).map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                      <SelectItem value={NEW_PROJECT_VALUE}>+ Tạo project mới</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {creatingNewProject && (
                  <div className="space-y-3 rounded-md border border-dashed p-3">
                    <Input
                      placeholder="Tên project mới"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                    <Textarea
                      placeholder="Mô tả project (optional)"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {!editingAccount && <p className="text-sm font-medium">Account</p>}
              <Input
                placeholder="Tên (vd: Admin, QA Tester)"
                value={accountForm.name}
                onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
              <Input
                placeholder="Mail / username"
                value={accountForm.username}
                onChange={(e) => setAccountForm((f) => ({ ...f, username: e.target.value }))}
                required
              />
              <Input
                placeholder="Password"
                value={accountForm.password}
                onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
              <Textarea
                placeholder="Mô tả (optional)"
                value={accountForm.description}
                onChange={(e) => setAccountForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={formBusy}>
              {editingAccount ? 'Save' : creatingNewProject ? 'Create project & account' : 'Create account'}
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
              placeholder="Tên project"
              value={projectForm.name}
              onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Textarea
              placeholder="Mô tả project (optional)"
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
