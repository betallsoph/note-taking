import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/services/api'
import { useState } from 'react'
import type { ArticleStatus } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleId?: string
}

export function ArticleFormDialog({ open, onOpenChange, articleId }: Props) {
  const queryClient = useQueryClient()
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: api.categories.list })
  const { data: existing } = useQuery({
    queryKey: ['article', articleId],
    queryFn: () => api.articles.get(articleId!),
    enabled: !!articleId && open,
  })

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [status, setStatus] = useState<ArticleStatus>('not_started')

  const reset = () => {
    if (existing) {
      setTitle(existing.title)
      setExcerpt(existing.excerpt ?? '')
      setCategoryId(existing.categoryId ?? '')
      setStatus(existing.status)
    } else {
      setTitle('')
      setExcerpt('')
      setCategoryId('')
      setStatus('not_started')
    }
  }

  const createMutation = useMutation({
    mutationFn: api.articles.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      onOpenChange(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof api.articles.update>[1]) =>
      api.articles.update(articleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['article', articleId] })
      onOpenChange(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      title,
      excerpt,
      categoryId: categoryId || null,
      status,
    }
    if (articleId) updateMutation.mutate(payload)
    else createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) reset() }}>
      <DialogContent onOpenAutoFocus={reset}>
        <DialogHeader>
          <DialogTitle>{articleId ? 'Edit Article' : 'New Article'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea placeholder="Excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as ArticleStatus)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="need_review">Need Review</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{articleId ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
