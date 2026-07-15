import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, NotePencil } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DifficultyBadge } from '@/components/shared/badges'
import { INTERVIEW_CATEGORIES } from '@/types'
import { CreateFlashcardDialog } from './CreateFlashcardDialog'

export function FlashcardsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const queryClient = useQueryClient()

  const params = categoryFilter !== 'all' ? { category: categoryFilter } : undefined
  const { data: flashcards, isLoading } = useQuery({
    queryKey: ['flashcards', params],
    queryFn: () => api.flashcards.list(params),
  })

  const deleteMutation = useMutation({
    mutationFn: api.flashcards.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcards'] }),
  })

  return (
    <div>
      <PageHeader
        title="Flashcards"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Card
          </Button>
        }
      />

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="mb-6 w-48">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {INTERVIEW_CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : flashcards?.length === 0 ? (
        <EmptyState
          title="No flashcards"
          description="Create cards here, or select text in a note and add it as a flashcard."
          action={<Button onClick={() => setCreateOpen(true)}>Create Card</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {flashcards?.map((card) => (
            <div key={card.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{card.category}</span>
                <DifficultyBadge difficulty={card.difficulty} />
              </div>
              <p className="font-medium">{card.question}</p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{card.answer}</p>
              {card.sourceNoteId && (
                <Link
                  to={`/notes/${card.sourceNoteId}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <NotePencil className="h-3.5 w-3.5" /> From note
                </Link>
              )}
              <div className="mt-3">
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(card.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateFlashcardDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
