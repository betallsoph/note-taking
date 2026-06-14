import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ReviewRating } from '@/types'

export function ReviewsPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const queryClient = useQueryClient()

  const { data: dueCards, isLoading } = useQuery({
    queryKey: ['flashcards-due'],
    queryFn: api.flashcards.due,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: ReviewRating }) =>
      api.flashcards.review(id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards-due'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setFlipped(false)
      setCurrentIndex(0)
    },
  })

  const card = dueCards?.[currentIndex]

  if (isLoading) return <Skeleton className="h-96" />

  return (
    <div>
      <PageHeader
        title="Review Queue"
        description="Spaced repetition review — intervals: 1, 3, 7, 14, 30 days"
      />

      {!dueCards?.length ? (
        <EmptyState title="All caught up!" description="No flashcards due for review today." />
      ) : (
        <div className="mx-auto max-w-xl">
          <p className="mb-4 text-center text-sm text-muted-foreground">
            {currentIndex + 1} of {dueCards.length} due today
          </p>

          <div
            className="perspective-[1000px] cursor-pointer"
            onClick={() => setFlipped(!flipped)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={flipped ? 'back' : 'front'}
                initial={{ rotateY: flipped ? -90 : 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: flipped ? 90 : -90, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="min-h-[240px]">
                  <CardContent className="flex min-h-[240px] items-center justify-center p-8 text-center">
                    <p className="text-lg">{flipped ? card?.answer : card?.question}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="mt-2 text-center text-xs text-muted-foreground">Click card to flip</p>

          {flipped && card && (
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['again', 'hard', 'good', 'easy'] as ReviewRating[]).map((rating) => (
                <Button
                  key={rating}
                  variant={rating === 'again' ? 'destructive' : rating === 'easy' ? 'default' : 'outline'}
                  onClick={() => reviewMutation.mutate({ id: card.id, rating })}
                  className="capitalize"
                >
                  {rating}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
