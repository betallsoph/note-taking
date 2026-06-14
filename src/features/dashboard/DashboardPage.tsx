import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, Code, Cards, MapTrifold, Fire, Clock } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader } from '@/components/ui/misc'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { StatusBadge } from '@/components/shared/badges'
import { formatDate } from '@/lib/utils'

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: api.dashboard.stats,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Articles', value: data?.totalArticles ?? 0, icon: BookOpen, href: '/knowledge' },
    { label: 'Problems', value: data?.totalProblems ?? 0, icon: Code, href: '/problems' },
    { label: 'Flashcards', value: data?.totalFlashcards ?? 0, icon: Cards, href: '/flashcards' },
    { label: 'Roadmaps', value: data?.totalRoadmaps ?? 0, icon: MapTrifold, href: '/roadmaps' },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your personal computer science learning hub"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} to={href}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" weight="duotone" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight">{value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Fire className="h-4 w-4 text-amber-500" weight="duotone" />
              Learning Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{data?.learningStreak ?? 0}</p>
            <p className="text-sm text-muted-foreground">days in a row</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" weight="duotone" />
              Reviews Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{data?.reviewDueToday ?? 0}</p>
            <Link to="/reviews" className="text-sm text-primary hover:underline">
              Start reviewing
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Topics Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold">{data?.topicsCompleted ?? 0}</p>
            <p className="text-sm text-muted-foreground">articles marked complete</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Recently Updated Notes</h2>
        <div className="space-y-2">
          {data?.recentlyUpdatedNotes.map((article) => (
            <Link
              key={article.id}
              to={`/knowledge/${article.id}`}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <div>
                <p className="font-medium">{article.title}</p>
                <p className="text-sm text-muted-foreground">{article.excerpt}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={article.status} />
                <span className="text-xs text-muted-foreground">{formatDate(article.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
