import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCircle, Plus } from '@phosphor-icons/react'
import { api } from '@/services/api'
import type { Reminder } from '@/types'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime, toDatetimeLocalValue } from '@/lib/utils'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'active' | 'overdue' | 'upcoming' | 'completed'

function reminderTone(reminder: Reminder) {
  if (reminder.isCompleted) return 'completed'
  return new Date(reminder.remindAt).getTime() <= Date.now() ? 'overdue' : 'upcoming'
}

export function RemindersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Reminder | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [remindAt, setRemindAt] = useState(toDatetimeLocalValue())
  const queryClient = useQueryClient()

  const params = statusFilter !== 'all' ? { status: statusFilter } : undefined
  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders', params],
    queryFn: () => api.reminders.list(params),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['reminders'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const createMutation = useMutation({
    mutationFn: api.reminders.create,
    onSuccess: () => {
      invalidate()
      setCreateOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Reminder> }) =>
      api.reminders.update(id, data),
    onSuccess: () => {
      invalidate()
      setEditing(null)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.reminders.delete,
    onSuccess: invalidate,
  })

  const counts = useMemo(() => {
    const items = reminders ?? []
    return {
      overdue: items.filter((r) => reminderTone(r) === 'overdue').length,
      upcoming: items.filter((r) => reminderTone(r) === 'upcoming').length,
      completed: items.filter((r) => r.isCompleted).length,
    }
  }, [reminders])

  function resetForm() {
    setTitle('')
    setBody('')
    setRemindAt(toDatetimeLocalValue())
  }

  function openCreate() {
    resetForm()
    setEditing(null)
    setCreateOpen(true)
  }

  function openEdit(reminder: Reminder) {
    setEditing(reminder)
    setTitle(reminder.title)
    setBody(reminder.body ?? '')
    setRemindAt(toDatetimeLocalValue(reminder.remindAt))
    setCreateOpen(true)
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      title,
      body: body.trim() || null,
      remindAt: new Date(remindAt).toISOString(),
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div>
      <PageHeader
        title="Reminders"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New Reminder
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{counts.overdue} overdue</span>
          <span>{counts.upcoming} upcoming</span>
          <span>{counts.completed} done</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : reminders?.length === 0 ? (
        <EmptyState
          title="No reminders"
          description="Add a reminder for tasks, deadlines, or things you keep forgetting."
          action={
            <Button onClick={openCreate}>
              <Bell className="h-4 w-4" />
              Create Reminder
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {reminders?.map((reminder) => {
            const tone = reminderTone(reminder)
            return (
              <div
                key={reminder.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-4',
                  tone === 'overdue' && 'border-rose-500/40 bg-rose-500/5',
                  reminder.isCompleted && 'opacity-70',
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 shrink-0"
                  title={reminder.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                  onClick={() =>
                    updateMutation.mutate({
                      id: reminder.id,
                      data: { isCompleted: !reminder.isCompleted },
                    })
                  }
                >
                  <CheckCircle
                    className={cn(
                      'h-5 w-5',
                      reminder.isCompleted ? 'text-emerald-500' : 'text-muted-foreground',
                    )}
                    weight={reminder.isCompleted ? 'fill' : 'regular'}
                  />
                </Button>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => openEdit(reminder)}
                >
                  <p
                    className={cn(
                      'font-medium',
                      reminder.isCompleted && 'line-through text-muted-foreground',
                    )}
                  >
                    {reminder.title}
                  </p>
                  {reminder.body && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {reminder.body}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span
                      className={cn(
                        tone === 'overdue' && 'text-rose-500',
                        tone === 'upcoming' && 'text-amber-600',
                        tone === 'completed' && 'text-muted-foreground',
                      )}
                    >
                      {formatDateTime(reminder.remindAt)}
                    </span>
                    {tone === 'overdue' && (
                      <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-500">
                        Overdue
                      </span>
                    )}
                    {tone === 'completed' && (
                      <span className="rounded-md bg-muted px-2 py-0.5">Done</span>
                    )}
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(reminder.id)}
                >
                  Delete
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setEditing(null)
            resetForm()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Reminder' : 'New Reminder'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-4">
            <Input
              placeholder="What should I remember?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Optional details"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <Input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              required
            />
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
