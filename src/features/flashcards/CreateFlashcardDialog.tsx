import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { INTERVIEW_CATEGORIES, type Difficulty } from '@/types'

export type FlashcardDraft = {
  question?: string
  answer?: string
  category?: string
  difficulty?: Difficulty
  sourceNoteId?: string | null
}

function suggestCategory(tags: string[] | undefined, fallback = 'Backend') {
  if (!tags?.length) return fallback
  const areas = INTERVIEW_CATEGORIES.map((c) => c.toLowerCase())
  for (const tag of tags) {
    const normalized = tag.replace(/-/g, ' ').toLowerCase()
    const exact = INTERVIEW_CATEGORIES.find((c) => c.toLowerCase() === normalized)
    if (exact) return exact
    const partial = INTERVIEW_CATEGORIES.find(
      (c) => normalized.includes(c.toLowerCase()) || c.toLowerCase().includes(normalized),
    )
    if (partial) return partial
    const idx = areas.findIndex((area) => normalized.includes(area))
    if (idx >= 0) return INTERVIEW_CATEGORIES[idx]
  }
  return fallback
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft?: FlashcardDraft | null
  noteTags?: string[]
  title?: string
}

export function CreateFlashcardDialog({
  open,
  onOpenChange,
  draft,
  noteTags,
  title = 'New Flashcard',
}: Props) {
  const queryClient = useQueryClient()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('Backend')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [sourceNoteId, setSourceNoteId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setQuestion(draft?.question?.trim() ?? '')
    setAnswer(draft?.answer?.trim() ?? '')
    setCategory(draft?.category ?? suggestCategory(noteTags))
    setDifficulty(draft?.difficulty ?? 'medium')
    setSourceNoteId(draft?.sourceNoteId ?? null)
  }, [open, draft, noteTags])

  const createMutation = useMutation({
    mutationFn: api.flashcards.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate({
              question: question.trim(),
              answer: answer.trim(),
              category,
              difficulty,
              sourceNoteId,
            })
          }}
          className="space-y-4"
        >
          {sourceNoteId && (
            <p className="text-xs text-muted-foreground">Linked to the current note after save.</p>
          )}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
          <Textarea
            placeholder="Answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            className="min-h-28"
          />
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create flashcard'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
