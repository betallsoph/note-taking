import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RoadmapItemStatus } from '@/types'

export function RoadmapsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()

  const { data: roadmaps, isLoading } = useQuery({
    queryKey: ['roadmaps'],
    queryFn: api.roadmaps.list,
  })

  const createMutation = useMutation({
    mutationFn: api.roadmaps.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] })
      setCreateOpen(false)
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ roadmapId, itemId, status }: { roadmapId: string; itemId: string; status: RoadmapItemStatus }) =>
      api.roadmaps.updateItem(roadmapId, itemId, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roadmaps'] }),
  })

  return (
    <div>
      <PageHeader
        title="Learning Roadmaps"
        description="Track your progress across learning paths"
        actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Roadmap</Button>}
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : roadmaps?.length === 0 ? (
        <EmptyState title="No roadmaps" description="Create a roadmap to track your learning journey." action={<Button onClick={() => setCreateOpen(true)}>Create Roadmap</Button>} />
      ) : (
        <div className="space-y-6">
          {roadmaps?.map((roadmap) => (
            <Card key={roadmap.id}>
              <CardHeader>
                <CardTitle>{roadmap.title}</CardTitle>
                {roadmap.description && <p className="text-sm text-muted-foreground">{roadmap.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roadmap.items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-md border px-4 py-3">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                      </div>
                      <Select
                        value={item.status}
                        onValueChange={(v) =>
                          updateItemMutation.mutate({
                            roadmapId: roadmap.id,
                            itemId: item.id,
                            status: v as RoadmapItemStatus,
                          })
                        }
                      >
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">Not Started</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Roadmap</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ title, description }) }} className="space-y-4">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button type="submit" className="w-full">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
