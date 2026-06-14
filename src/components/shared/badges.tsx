import { cn } from '@/lib/utils'
import type { ArticleStatus, Difficulty, RoadmapItemStatus } from '@/types'
import { ARTICLE_STATUS_LABELS } from '@/types'

export function StatusBadge({ status }: { status: ArticleStatus }) {
  const colors: Record<ArticleStatus, string> = {
    not_started: 'bg-muted text-muted-foreground',
    learning: 'bg-blue-500/15 text-blue-500',
    completed: 'bg-emerald-500/15 text-emerald-500',
    need_review: 'bg-amber-500/15 text-amber-500',
  }
  return (
    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', colors[status])}>
      {ARTICLE_STATUS_LABELS[status]}
    </span>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const colors: Record<Difficulty, string> = {
    easy: 'bg-emerald-500/15 text-emerald-500',
    medium: 'bg-amber-500/15 text-amber-500',
    hard: 'bg-rose-500/15 text-rose-500',
  }
  return (
    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize', colors[difficulty])}>
      {difficulty}
    </span>
  )
}

export function RoadmapStatusBadge({ status }: { status: RoadmapItemStatus }) {
  const colors: Record<RoadmapItemStatus, string> = {
    not_started: 'bg-muted text-muted-foreground',
    in_progress: 'bg-blue-500/15 text-blue-500',
    completed: 'bg-emerald-500/15 text-emerald-500',
  }
  const labels: Record<RoadmapItemStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
  }
  return (
    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', colors[status])}>
      {labels[status]}
    </span>
  )
}
