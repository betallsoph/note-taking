import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CaretRight, FileText, FolderSimple, Key } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, Skeleton } from '@/components/ui/misc'
import {
  credentialLabel,
  entryCountLabel,
  environmentLabel,
  isEnvFileKind,
} from '@/features/dev-accounts/devVaultUtils'
import type { DevAccount, DevProject } from '@/types'

export type DevVaultLinkSelection = {
  projectId: string
  accountId: string
  label: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (selection: DevVaultLinkSelection) => void
}

function linkLabel(project: DevProject, account: DevAccount) {
  return `${project.name} / ${account.name}`
}

export function InsertDevVaultLinkDialog({ open, onOpenChange, onSelect }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['dev-accounts'],
    queryFn: api.devAccounts.listProjects,
    enabled: open,
  })

  const selectedProject = projects?.find((project) => project.id === selectedProjectId) ?? null

  useEffect(() => {
    if (!open) setSelectedProjectId(null)
  }, [open])

  function handleSelect(project: DevProject, account: DevAccount) {
    onSelect({
      projectId: project.id,
      accountId: account.id,
      label: linkLabel(project, account),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedProject ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="-ml-2 h-8 w-8"
                  onClick={() => setSelectedProjectId(null)}
                  title="Back to projects"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="truncate">{selectedProject.name}</span>
              </>
            ) : (
              'Insert Dev Vault link'
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-48" />
        ) : selectedProject ? (
          (selectedProject.accounts?.length ?? 0) === 0 ? (
            <EmptyState
              title="No entries in this project"
              description="Add credentials in Dev Vault first, then link them from your note."
            />
          ) : (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto">
              {selectedProject.accounts?.map((account) => {
                const envFile = isEnvFileKind(account.kind)
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => handleSelect(selectedProject, account)}
                    className="flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors hover:bg-muted/50"
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
                      </div>
                      {account.description ? (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {account.description}
                        </p>
                      ) : null}
                    </div>
                    <CaretRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          )
        ) : projects?.length === 0 ? (
          <EmptyState
            title="No Dev Vault projects"
            description="Create a project in Dev Vault before linking entries in notes."
          />
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
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
      </DialogContent>
    </Dialog>
  )
}
