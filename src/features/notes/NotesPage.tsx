import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MagnifyingGlass, NotePencil, Plus, PushPin } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, notePreview } from '@/lib/utils'
import { NoteFormDialog } from './NoteFormDialog'

export function NotesPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const params = search ? { search } : undefined
  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', params],
    queryFn: () => api.notes.list(params),
  })

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

  return (
    <div>
      <PageHeader
        title="Notes"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Note
          </Button>
        }
      />

      <div className="relative mb-6">
        <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : notes?.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          description="Dump whatever is on your mind. No categories, no status — just notes."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <NotePencil className="h-4 w-4" />
              Start writing
            </Button>
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
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(note.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <NoteFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
