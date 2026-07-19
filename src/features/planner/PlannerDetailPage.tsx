import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trash } from '@phosphor-icons/react'
import { api } from '@/services/api'
import type { PlannerHorizon, PlannerItem, PlannerScope, PlannerStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlannerEditor } from './PlannerEditor'

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

function toDateInputValue(date: string | null): string {
  if (!date) return ''
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function PlannerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [scope, setScope] = useState<PlannerScope>('personal')
  const [projectName, setProjectName] = useState('')
  const [hasTargetDate, setHasTargetDate] = useState(false)
  const [targetDate, setTargetDate] = useState('')

  const { data: item, isLoading } = useQuery({
    queryKey: ['planner-item', id],
    queryFn: () => api.planner.get(id!),
    enabled: !!id,
  })

  const { data: allItems } = useQuery({
    queryKey: ['planner', 'all'],
    queryFn: () => api.planner.list(),
    staleTime: 30_000,
  })

  useEffect(() => {
    if (!item) return
    setTitle(item.title)
    setScope(item.scope)
    setProjectName(item.projectName ?? '')
    setHasTargetDate(!!item.targetDate)
    setTargetDate(toDateInputValue(item.targetDate))
  }, [item])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['planner-item', id] })
    queryClient.invalidateQueries({ queryKey: ['planner'] })
  }

  const titleMutation = useMutation({
    mutationFn: (nextTitle: string) => api.planner.update(id!, { title: nextTitle || 'Untitled' }),
    onSuccess: invalidate,
  })

  const metaMutation = useMutation({
    mutationFn: (data: Partial<PlannerItem>) => api.planner.update(id!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['planner-item', id], updated)
      queryClient.invalidateQueries({ queryKey: ['planner'], refetchType: 'none' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.planner.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner'] })
      navigate('/planner')
    },
  })

  const projectNameSuggestions = [...new Set(
    (allItems ?? [])
      .filter((entry) => entry.scope === 'project' && entry.projectName?.trim())
      .map((entry) => entry.projectName!.trim()),
  )].sort((a, b) => a.localeCompare(b))

  if (isLoading) return <Skeleton className="h-96" />
  if (!item) return <p>Plan not found</p>

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/planner">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title.trim() !== item.title) titleMutation.mutate(title.trim())
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          className="border-none bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
          placeholder="Untitled"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm(`Delete plan "${item.title}"?`)) deleteMutation.mutate()
          }}
        >
          <Trash className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Horizon</label>
            <Select
              value={item.horizon}
              onValueChange={(value) => metaMutation.mutate({ horizon: value as PlannerHorizon })}
            >
              <SelectTrigger className="w-[8.5rem]">
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
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={item.status}
              onValueChange={(value) => metaMutation.mutate({ status: value as PlannerStatus })}
            >
              <SelectTrigger className="w-[8.5rem]">
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Scope</label>
            <Select
              value={scope}
              onValueChange={(value) => {
                const nextScope = value as PlannerScope
                setScope(nextScope)
                metaMutation.mutate({
                  scope: nextScope,
                  projectName: nextScope === 'project' ? projectName.trim() || null : null,
                })
              }}
            >
              <SelectTrigger className="w-[8.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === 'project' && (
            <div className="min-w-[12rem] flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Project name</label>
              <Input
                list="planner-detail-project-names"
                placeholder="e.g. Side app"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => {
                  const trimmed = projectName.trim()
                  if (trimmed !== (item.projectName ?? '')) {
                    metaMutation.mutate({ projectName: trimmed || null })
                  }
                }}
              />
              <datalist id="planner-detail-project-names">
                {projectNameSuggestions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasTargetDate}
              onChange={(e) => {
                const checked = e.target.checked
                setHasTargetDate(checked)
                if (!checked) {
                  setTargetDate('')
                  metaMutation.mutate({ targetDate: null })
                } else if (targetDate) {
                  metaMutation.mutate({
                    targetDate: new Date(`${targetDate}T12:00:00`).toISOString(),
                  })
                }
              }}
              className="h-4 w-4 rounded border border-input"
            />
            Set target date
          </label>
          {hasTargetDate && (
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => {
                const value = e.target.value
                setTargetDate(value)
                metaMutation.mutate({
                  targetDate: value ? new Date(`${value}T12:00:00`).toISOString() : null,
                })
              }}
              className="w-auto"
            />
          )}
        </div>
      </div>

      <PlannerEditor plannerId={item.id} content={item.content ?? {}} />
    </div>
  )
}
