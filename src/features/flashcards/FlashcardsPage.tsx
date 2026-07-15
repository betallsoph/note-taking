import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DifficultyBadge } from '@/components/shared/badges'
import { INTERVIEW_CATEGORIES, type Difficulty } from '@/types'

export function FlashcardsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const queryClient = useQueryClient()

  const params = categoryFilter !== 'all' ? { category: categoryFilter } : undefined
  const { data: flashcards, isLoading } = useQuery({
    queryKey: ['flashcards', params],
    queryFn: () => api.flashcards.list(params),
  })

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('DB')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')

  const createMutation = useMutation({
    mutationFn: api.flashcards.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      setCreateOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.flashcards.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flashcards'] }),
  })

  return (
    <div>
      <PageHeader
        title="Flashcards"
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Card</Button>}
      />

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="mb-6 w-48"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {INTERVIEW_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : flashcards?.length === 0 ? (
        <EmptyState title="No flashcards" description="Create flashcards for interview prep." action={<Button onClick={() => setCreateOpen(true)}>Create Card</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {flashcards?.map((card) => (
            <div key={card.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs">{card.category}</span>
                <DifficultyBadge difficulty={card.difficulty} />
              </div>
              <p className="font-medium">{card.question}</p>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{card.answer}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => deleteMutation.mutate(card.id)}>Delete</Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Flashcard</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ question, answer, category, difficulty }) }} className="space-y-4">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INTERVIEW_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
            <Textarea placeholder="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} required />
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
