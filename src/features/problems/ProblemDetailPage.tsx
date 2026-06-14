import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { DifficultyBadge } from '@/components/shared/badges'

export function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: problem, isLoading } = useQuery({
    queryKey: ['problem', id],
    queryFn: () => api.problems.get(id!),
    enabled: !!id,
  })

  if (isLoading) return <Skeleton className="h-96" />
  if (!problem) return <p>Problem not found</p>

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/problems"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{problem.title}</h1>
          <div className="mt-2 flex gap-2">
            <DifficultyBadge difficulty={problem.difficulty} />
            {problem.source && <span className="text-sm text-muted-foreground">{problem.source}</span>}
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
        <CardContent><p className="whitespace-pre-wrap">{problem.description}</p></CardContent>
      </Card>

      {problem.constraints && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Constraints</CardTitle></CardHeader>
          <CardContent><p>{problem.constraints}</p></CardContent>
        </Card>
      )}

      {problem.learningNotes && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Learning Notes</CardTitle></CardHeader>
          <CardContent><p>{problem.learningNotes}</p></CardContent>
        </Card>
      )}

      <h2 className="mb-4 text-lg font-semibold">Solutions ({problem.solutions.length})</h2>
      <div className="space-y-4">
        {problem.solutions.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {s.title}
                {s.isOptimal && <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-500">Optimal</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {s.explanation && <p className="mb-4 text-sm text-muted-foreground">{s.explanation}</p>}
              <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">{s.code}</pre>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                {s.timeComplexity && <span>Time: {s.timeComplexity}</span>}
                {s.spaceComplexity && <span>Space: {s.spaceComplexity}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {problem.mistakes.length > 0 && (
        <>
          <h2 className="mb-4 mt-8 text-lg font-semibold">Mistakes</h2>
          <div className="space-y-3">
            {problem.mistakes.map((m) => (
              <Card key={m.id}>
                <CardContent className="pt-6">
                  <span className="rounded-md bg-rose-500/15 px-2 py-0.5 text-xs uppercase text-rose-500">{m.type.replace('_', ' ')}</span>
                  <p className="mt-2">{m.description}</p>
                  {m.lessonLearned && <p className="mt-2 text-sm text-muted-foreground">Lesson: {m.lessonLearned}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
