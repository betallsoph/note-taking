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
import type { DevAccount, DevProject } from '@/types'

type ProjectForm = { name: string; description: string }
type AccountForm = { name: string; username: string; password: string; description: string }

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
  const [projectOpen, setProjectOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<DevProject | null>(null)
  const [editingAccount, setEditingAccount] = useState<DevAccount | null>(null)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProject)
  const [accountForm, setAccountForm] = useState<AccountForm>(emptyAccount)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  const { data: projects, isLoading } = useQuery({
    queryKey: ['dev-accounts'],
    queryFn: api.devAccounts.listProjects,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dev-accounts'] })

  const createProjectMutation = useMutation({
    mutationFn: api.devAccounts.createProject,
    onSuccess: (project) => {
      invalidate()
      closeProjectDialog()
      // After creating a project, open the 4-field account form right away.
      openCreateAccount(project.id)
    },
  })

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DevProject> }) =>
      api.devAccounts.updateProject(id, data),
    onSuccess: () => {
      invalidate()
      closeProjectDialog()
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: api.devAccounts.deleteProject,
    onSuccess: invalidate,
  })

  const createAccountMutation = useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Partial<DevAccount> }) =>
      api.devAccounts.createAccount(projectId, data),
    onSuccess: () => {
      invalidate()
      closeAccountDialog()
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
      closeAccountDialog()
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: ({ projectId, accountId }: { projectId: string; accountId: string }) =>
      api.devAccounts.deleteAccount(projectId, accountId),
    onSuccess: invalidate,
  })

  function closeProjectDialog() {
    setProjectOpen(false)
    setEditingProject(null)
    setProjectForm(emptyProject)
  }

  function closeAccountDialog() {
    setAccountOpen(false)
    setEditingAccount(null)
    setActiveProjectId(null)
    setAccountForm(emptyAccount)
  }

  function openCreateProject() {
    setEditingProject(null)
    setProjectForm(emptyProject)
    setProjectOpen(true)
  }

  function openEditProject(project: DevProject) {
    setEditingProject(project)
    setProjectForm({
      name: project.name,
      description: project.description ?? '',
    })
    setProjectOpen(true)
  }

  function openCreateAccount(projectId: string) {
    setActiveProjectId(projectId)
    setEditingAccount(null)
    setAccountForm(emptyAccount)
    setAccountOpen(true)
  }

  function openEditAccount(projectId: string, account: DevAccount) {
    setActiveProjectId(projectId)
    setEditingAccount(account)
    setAccountForm({
      name: account.name,
      username: account.username,
      password: account.password,
      description: account.description ?? '',
    })
    setAccountOpen(true)
  }

  function submitProject(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: projectForm.name.trim(),
      description: projectForm.description.trim() || null,
    }
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: payload })
    } else {
      createProjectMutation.mutate(payload)
    }
  }

  function submitAccount(e: React.FormEvent) {
    e.preventDefault()
    if (!activeProjectId) return
    const payload = {
      name: accountForm.name.trim(),
      username: accountForm.username.trim(),
      password: accountForm.password,
      description: accountForm.description.trim() || null,
    }
    if (editingAccount) {
      updateAccountMutation.mutate({
        projectId: activeProjectId,
        accountId: editingAccount.id,
        data: payload,
      })
    } else {
      createAccountMutation.mutate({ projectId: activeProjectId, data: payload })
    }
  }

  function togglePassword(accountId: string) {
    setVisiblePasswords((prev) => ({ ...prev, [accountId]: !prev[accountId] }))
  }

  return (
    <div>
      <PageHeader
        title="Dev Accounts"
        description="Lưu account theo từng project — tên, mail/username, password, mô tả"
        actions={
          <Button onClick={openCreateProject}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : projects?.length === 0 ? (
        <EmptyState
          title="Chưa có project nào"
          description="Tạo project rồi thêm các dev account bên dưới."
          action={<Button onClick={openCreateProject}>Create Project</Button>}
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
                  <Button variant="outline" size="sm" onClick={() => openCreateAccount(project.id)}>
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
                        <div
                          key={account.id}
                          className="rounded-md border px-4 py-3"
                        >
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
        open={projectOpen}
        onOpenChange={(open) => {
          if (!open) closeProjectDialog()
          else setProjectOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'New Project'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitProject} className="space-y-4">
            {!editingProject && (
              <p className="text-sm text-muted-foreground">
                Bước 1/2 — tạo project. Sau đó sẽ mở form thêm account (tên, mail/username, password, mô tả).
              </p>
            )}
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
            <Button
              type="submit"
              className="w-full"
              disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
            >
              {editingProject ? 'Save' : 'Create & add account'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={accountOpen}
        onOpenChange={(open) => {
          if (!open) closeAccountDialog()
          else setAccountOpen(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'New Account'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitAccount} className="space-y-4">
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
            <Button
              type="submit"
              className="w-full"
              disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
            >
              {editingAccount ? 'Save' : 'Create'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
