import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { DifficultyBadge } from '@/components/shared/badges'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Difficulty } from '@/types'

export function ProblemsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: problems, isLoading } = useQuery({
    queryKey: ['problems'],
    queryFn: () => api.problems.list(),
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [source, setSource] = useState('')

  const createMutation = useMutation({
    mutationFn: api.problems.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] })
      setCreateOpen(false)
      setTitle('')
      setDescription('')
    },
  })

  return (
    <div>
      <PageHeader
        title="Problem Solving"
        description="Your personal LeetCode notebook"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Problem
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : problems?.length === 0 ? (
        <EmptyState title="No problems yet" description="Add your first coding problem." action={<Button onClick={() => setCreateOpen(true)}>Add Problem</Button>} />
      ) : (
        <div className="space-y-2">
          {problems?.map((p) => (
            <Link
              key={p.id}
              to={`/problems/${p.id}`}
              className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/30"
            >
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">{p.source}</p>
              </div>
              <div className="flex items-center gap-2">
                <DifficultyBadge difficulty={p.difficulty} />
                {p.isSolved && (
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-500">Solved</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Problem</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate({ title, description, difficulty, source })
            }}
            className="space-y-4"
          >
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Source (e.g. LeetCode #1)" value={source} onChange={(e) => setSource(e.target.value)} />
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
