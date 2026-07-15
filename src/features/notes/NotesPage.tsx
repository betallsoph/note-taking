import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, MagnifyingGlass, NotePencil, Plus, PushPin } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatDate, notePreview } from '@/lib/utils'
import { NoteFormDialog } from './NoteFormDialog'

export function NotesPage() {
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const listParams = useMemo(() => {
    const params: Record<string, string> = {}
    if (search.trim()) params.search = search.trim()
    if (tag) params.tag = tag
    if (showArchived) params.archived = 'true'
    return params
  }, [search, tag, showArchived])

  const chipParams = useMemo(
    () => (showArchived ? { archived: 'true' } : {}),
    [showArchived],
  )

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', 'list', listParams],
    queryFn: () => api.notes.list(Object.keys(listParams).length ? listParams : undefined),
  })

  const { data: tagSource } = useQuery({
    queryKey: ['notes', 'chips', chipParams],
    queryFn: () => api.notes.list(showArchived ? { archived: 'true' } : undefined),
    staleTime: 60_000,
  })

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    for (const note of tagSource ?? []) {
      for (const t of note.tags ?? []) set.add(t)
    }
    return [...set].sort()
  }, [tagSource])

  const deleteMutation = useMutation({
    mutationFn: api.notes.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      api.notes.update(id, { isPinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      api.notes.update(id, { isArchived }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return (
    <div>
      <PageHeader
        title="Notes"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={showArchived ? 'secondary' : 'outline'}
              onClick={() => {
                setShowArchived((v) => !v)
                setTag(null)
              }}
            >
              <Archive className="h-4 w-4" />
              {showArchived ? 'Archived' : 'Archive'}
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </div>
        }
      />

      <div className="relative mb-4">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {availableTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTag(null)}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs transition-colors',
              !tag
                ? 'border-primary bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted',
            )}
          >
            All
          </button>
          {availableTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag((current) => (current === t ? null : t))}
              className={cn(
                'rounded-md border px-2.5 py-1 text-xs transition-colors',
                tag === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : notes?.length === 0 ? (
        <EmptyState
          title={showArchived ? 'No archived notes' : 'Nothing here yet'}
          description={
            showArchived
              ? 'Archived notes will show up here.'
              : 'Dump whatever is on your mind. Add light tags later if it helps.'
          }
          action={
            !showArchived ? (
              <Button onClick={() => setCreateOpen(true)}>
                <NotePencil className="h-4 w-4" />
                Start writing
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {notes?.map((note) => (
            <div
              key={note.id}
              className="flex flex-col rounded-lg border p-4 transition-colors hover:bg-accent/30"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <Link to={`/notes/${note.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium">{note.title || 'Untitled'}</p>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  title={note.isPinned ? 'Unpin' : 'Pin'}
                  onClick={() => pinMutation.mutate({ id: note.id, isPinned: !note.isPinned })}
                >
                  <PushPin
                    className="h-4 w-4"
                    weight={note.isPinned ? 'fill' : 'regular'}
                  />
                </Button>
              </div>
              <Link to={`/notes/${note.id}`} className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {notePreview(note.content)}
                </p>
              </Link>
              {(note.tags?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {(note.tags ?? []).map((t) => (
                    <span
                      key={t}
                      className="rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      archiveMutation.mutate({ id: note.id, isArchived: !note.isArchived })
                    }
                  >
                    {note.isArchived ? 'Restore' : 'Archive'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(note.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
