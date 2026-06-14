import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Copy, Archive } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import { StatusBadge } from '@/components/shared/badges'
import { ArticleFormDialog } from './ArticleFormDialog'
import { ArticleEditor } from './ArticleEditor'

export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [editOpen, setEditOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: () => api.articles.get(id!),
    enabled: !!id,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  })

  const duplicateMutation = useMutation({
    mutationFn: () => api.articles.duplicate(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: () => api.articles.archive(id!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  })

  if (isLoading) return <Skeleton className="h-96" />
  if (!article) return <p>Article not found</p>

  const category = categories?.find((c) => c.id === article.categoryId)

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link to="/knowledge">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{article.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            {category && (
              <span className="text-sm text-muted-foreground">{category.name}</span>
            )}
            <StatusBadge status={article.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
          <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate()}>
            <Copy className="h-4 w-4" /> Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate()}>
            <Archive className="h-4 w-4" /> Archive
          </Button>
        </div>
      </div>

      {article.excerpt && (
        <p className="mb-6 text-muted-foreground">{article.excerpt}</p>
      )}

      <ArticleEditor articleId={article.id} content={article.content} />

      <ArticleFormDialog open={editOpen} onOpenChange={setEditOpen} articleId={article.id} />
    </div>
  )
}
