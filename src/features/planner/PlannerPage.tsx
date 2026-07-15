import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Compass, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { api } from '@/services/api'
import type { PlannerHorizon, PlannerItem, PlannerScope, PlannerStatus } from '@/types'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn, formatDate } from '@/lib/utils'

type StatusFilter = 'all' | PlannerStatus
type HorizonFilter = 'all' | PlannerHorizon

const HORIZON_LABELS: Record<PlannerHorizon, string> = {
  now: 'Now',
  next: 'Next',
  later: 'Later',
  someday: 'Someday',
}

const STATUS_LABELS: Record<PlannerStatus, string> = {
  open: 'Open',
  doing: 'Doing',
  done: 'Done',
  dropped: 'Dropped',
}

const HORIZON_COLORS: Record<PlannerHorizon, string> = {
  now: 'bg-rose-500/15 text-rose-600',
  next: 'bg-amber-500/15 text-amber-600',
  later: 'bg-blue-500/15 text-blue-600',
  someday: 'bg-muted text-muted-foreground',
}

const STATUS_COLORS: Record<PlannerStatus, string> = {
  open: 'bg-muted text-muted-foreground',
  doing: 'bg-blue-500/15 text-blue-600',
  done: 'bg-emerald-500/15 text-emerald-600',
  dropped: 'bg-muted text-muted-foreground line-through',
}

function toDateInputValue(date: string | null): string {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function groupItems(items: PlannerItem[]) {
  const personal: PlannerItem[] = []
  const projects = new Map<string, PlannerItem[]>()

  for (const item of items) {
    if (item.scope === 'personal' || !item.projectName?.trim()) {
      personal.push(item)
      continue
    }
    const name = item.projectName.trim()
    const bucket = projects.get(name) ?? []
    bucket.push(item)
    projects.set(name, bucket)
  }

  const projectSections = [...projects.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  return { personal, projectSections }
}

function matchesSearch(item: PlannerItem, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    item.title.toLowerCase().includes(q) ||
    (item.body?.toLowerCase().includes(q) ?? false) ||
    (item.projectName?.toLowerCase().includes(q) ?? false)
  )
}

export function PlannerPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open')
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PlannerItem | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [scope, setScope] = useState<PlannerScope>('personal')
  const [projectName, setProjectName] = useState('')
  const [horizon, setHorizon] = useState<PlannerHorizon>('later')
  const [status, setStatus] = useState<PlannerStatus>('open')
  const [targetDate, setTargetDate] = useState('')
  const queryClient = useQueryClient()

  const listParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (statusFilter !== 'all') params.status = statusFilter
    if (horizonFilter !== 'all') params.horizon = horizonFilter
    return Object.keys(params).length > 0 ? params : undefined
  }, [statusFilter, horizonFilter])

  const { data: items, isLoading } = useQuery({
    queryKey: ['planner', listParams ?? {}],
    queryFn: () => api.planner.list(listParams),
  })

  const { data: allItems } = useQuery({
    queryKey: ['planner', 'all'],
    queryFn: () => api.planner.list(),
    staleTime: 30_000,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['planner'] })

  const createMutation = useMutation({
    mutationFn: api.planner.create,
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlannerItem> }) =>
      api.planner.update(id, data),
    onSuccess: () => {
      invalidate()
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.planner.delete,
    onSuccess: invalidate,
  })

  const projectNameSuggestions = useMemo(() => {
    const names = new Set<string>()
    for (const item of allItems ?? []) {
      if (item.scope === 'project' && item.projectName?.trim()) {
        names.add(item.projectName.trim())
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [allItems])

  const filteredItems = useMemo(
    () => (items ?? []).filter((item) => matchesSearch(item, search)),
    [items, search],
  )

  const { personal, projectSections } = useMemo(
    () => groupItems(filteredItems),
    [filteredItems],
  )

  const hasResults = personal.length > 0 || projectSections.some(([, rows]) => rows.length > 0)

  function resetForm() {
    setTitle('')
    setBody('')
    setScope('personal')
    setProjectName('')
    setHorizon('later')
    setStatus('open')
    setTargetDate('')
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditing(null)
    resetForm()
  }

  function openCreate() {
    resetForm()
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(item: PlannerItem) {
    setEditing(item)
    setTitle(item.title)
    setBody(item.body ?? '')
    setScope(item.scope)
    setProjectName(item.projectName ?? '')
    setHorizon(item.horizon)
    setStatus(item.status)
    setTargetDate(toDateInputValue(item.targetDate))
    setDialogOpen(true)
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      title: title.trim(),
      body: body.trim() || null,
      scope,
      projectName: scope === 'project' ? projectName.trim() || null : null,
      horizon,
      status,
      targetDate: targetDate ? new Date(`${targetDate}T12:00:00`).toISOString() : null,
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function renderItemRow(item: PlannerItem) {
    return (
      <div
        key={item.id}
        className={cn(
          'flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start',
          item.status === 'done' && 'opacity-75',
          item.status === 'dropped' && 'opacity-60',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'font-medium',
                (item.status === 'done' || item.status === 'dropped') &&
                  'text-muted-foreground line-through',
              )}
            >
              {item.title}
            </p>
            <span
              className={cn(
                'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                HORIZON_COLORS[item.horizon],
              )}
            >
              {HORIZON_LABELS[item.horizon]}
            </span>
            <span
              className={cn(
                'inline-flex rounded-md px-2 py-0.5 text-xs font-medium',
                STATUS_COLORS[item.status],
              )}
            >
              {STATUS_LABELS[item.status]}
            </span>
          </div>
          {item.body && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.body}</p>
          )}
          {item.targetDate && (
            <p className="mt-2 text-xs text-muted-foreground">
              Target: {formatDate(item.targetDate)}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Select
            value={item.status}
            onValueChange={(value) =>
              updateMutation.mutate({
                id: item.id,
                data: { status: value as PlannerStatus },
              })
            }
          >
            <SelectTrigger className="h-8 w-[7.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_LABELS) as PlannerStatus[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Edit">
            <PencilSimple className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm(`Delete plan "${item.title}"?`)) {
                deleteMutation.mutate(item.id)
              }
            }}
            title="Delete"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  function renderSection(sectionTitle: string, sectionItems: PlannerItem[]) {
    if (sectionItems.length === 0) return null
    return (
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-foreground/80">{sectionTitle}</h2>
          <Badge variant="secondary">{sectionItems.length}</Badge>
        </div>
        <div className="space-y-2">{sectionItems.map(renderItemRow)}</div>
      </section>
    )
  }

  return (
    <div>
      <PageHeader
        title="Planner"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New plan
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="doing">Doing</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="dropped">Dropped</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
            </SelectContent>
          </Select>

          <Select value={horizonFilter} onValueChange={(v) => setHorizonFilter(v as HorizonFilter)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Horizon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Now</SelectItem>
              <SelectItem value="next">Next</SelectItem>
              <SelectItem value="later">Later</SelectItem>
              <SelectItem value="someday">Someday</SelectItem>
              <SelectItem value="all">All horizons</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !hasResults ? (
        <EmptyState
          title="No plans yet"
          description="Capture project ideas, future app work, and long-range plans here. Unlike Reminders, there is no alarm time — and unlike Roadmaps, this is not tied to CS study topics."
          action={
            <Button onClick={openCreate}>
              <Compass className="h-4 w-4" />
              New plan
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {renderSection('Personal', personal)}
          {projectSections.map(([name, sectionItems]) => renderSection(name, sectionItems))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
          else setDialogOpen(true)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit plan' : 'New plan'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Details (optional)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Scope</label>
              <Select value={scope} onValueChange={(v) => setScope(v as PlannerScope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scope === 'project' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Project name</label>
                <Input
                  list="planner-project-names"
                  placeholder="e.g. Side app, Portfolio site"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
                <datalist id="planner-project-names">
                  {projectNameSuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Horizon</label>
                <Select value={horizon} onValueChange={(v) => setHorizon(v as PlannerHorizon)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(HORIZON_LABELS) as PlannerHorizon[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {HORIZON_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as PlannerStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as PlannerStatus[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Target (optional)</label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

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
