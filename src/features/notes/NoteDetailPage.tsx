import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArrowLeft, Cards, PushPin, Trash } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { CreateFlashcardDialog, type FlashcardDraft } from '@/features/flashcards/CreateFlashcardDialog'
import { NoteEditor } from './NoteEditor'
import { NoteTagsInput } from './NoteTagsInput'

export function NoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [flashcardOpen, setFlashcardOpen] = useState(false)
  const [flashcardDraft, setFlashcardDraft] = useState<FlashcardDraft | null>(null)

  const { data: note, isLoading } = useQuery({
    queryKey: ['note', id],
    queryFn: () => api.notes.get(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (!note) return
    setTitle(note.title)
    setTags(note.tags ?? [])
  }, [note])

  const titleMutation = useMutation({
    mutationFn: (nextTitle: string) => api.notes.update(id!, { title: nextTitle || 'Untitled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const tagsMutation = useMutation({
    mutationFn: (nextTags: string[]) => api.notes.update(id!, { tags: nextTags }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['note', id], updated)
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const pinMutation = useMutation({
    mutationFn: () => api.notes.update(id!, { isPinned: !note?.isPinned }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: () => api.notes.update(id!, { isArchived: !note?.isArchived }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', id] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.notes.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/notes')
    },
  })

  if (isLoading) return <Skeleton className="h-96" />
  if (!note) return <p>Note not found</p>

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link to="/notes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title.trim() !== note.title) titleMutation.mutate(title.trim())
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
            }
          }}
          className="border-none bg-transparent px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
          placeholder="Untitled"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFlashcardDraft({
              question: title.trim() || note.title || 'Untitled',
              answer: '',
              sourceNoteId: note.id,
            })
            setFlashcardOpen(true)
          }}
        >
          <Cards className="h-4 w-4" />
          Flashcard
        </Button>
        <Button variant="outline" size="sm" onClick={() => pinMutation.mutate()}>
          <PushPin className="h-4 w-4" weight={note.isPinned ? 'fill' : 'regular'} />
          {note.isPinned ? 'Pinned' : 'Pin'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate()}>
          <Archive className="h-4 w-4" />
          {note.isArchived ? 'Restore' : 'Archive'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate()}>
          <Trash className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="mb-6 max-w-xl">
        <NoteTagsInput
          tags={tags}
          onChange={(next) => {
            setTags(next)
            tagsMutation.mutate(next)
          }}
          placeholder="Add tag — Enter to save"
        />
      </div>

      <NoteEditor noteId={note.id} content={note.content} noteTitle={title || note.title} noteTags={tags} />

      <CreateFlashcardDialog
        open={flashcardOpen}
        onOpenChange={setFlashcardOpen}
        draft={flashcardDraft}
        noteTags={tags}
        title="Add flashcard from note"
      />
    </div>
  )
}
