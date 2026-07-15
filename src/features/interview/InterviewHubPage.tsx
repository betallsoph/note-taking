import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { PageHeader, Skeleton } from '@/components/ui/misc'
import { DifficultyBadge } from '@/components/shared/badges'
import { INTERVIEW_CATEGORIES } from '@/types'

export function InterviewHubPage() {
  const [category, setCategory] = useState('DB')

  const { data: flashcards, isLoading } = useQuery({
    queryKey: ['flashcards', { category }],
    queryFn: () => api.flashcards.list({ category }),
  })

  return (
    <div>
      <PageHeader
        title="Interview Hub"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {INTERVIEW_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              category === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <div className="space-y-3">
          {flashcards?.map((card) => (
            <details key={card.id} className="group rounded-lg border">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
                {card.question}
                <DifficultyBadge difficulty={card.difficulty} />
              </summary>
              <div className="border-t px-4 pb-4 pt-2">
                <p className="text-muted-foreground">{card.answer}</p>
                {card.personalNotes && (
                  <p className="mt-2 text-sm italic text-muted-foreground">Notes: {card.personalNotes}</p>
                )}
              </div>
            </details>
          ))}
          {flashcards?.length === 0 && (
            <p className="text-center text-muted-foreground">No questions in this category yet.</p>
          )}
        </div>
      )}
    </div>
  )
}
