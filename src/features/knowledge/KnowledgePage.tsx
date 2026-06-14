import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, MagnifyingGlass } from '@phosphor-icons/react'
import { api } from '@/services/api'
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/misc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/shared/badges'
import { formatDate } from '@/lib/utils'
import { ArticleFormDialog } from './ArticleFormDialog'

export function KnowledgePage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const params: Record<string, string> = {}
  if (search) params.search = search
  if (statusFilter !== 'all') params.status = statusFilter
  if (categoryFilter !== 'all') params.category = categoryFilter

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles', params],
    queryFn: () => api.articles.list(params),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  })

  const deleteMutation = useMutation({
    mutationFn: api.articles.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles'] }),
  })

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Store and organize your computer science notes"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Article
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="need_review">Need Review</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : articles?.length === 0 ? (
        <EmptyState
          title="No articles yet"
          description="Create your first article to start building your knowledge base."
          action={<Button onClick={() => setCreateOpen(true)}>Create Article</Button>}
        />
      ) : (
        <div className="space-y-2">
          {articles?.map((article) => {
            const category = categories?.find((c) => c.id === article.categoryId)
            return (
              <div
                key={article.id}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/30"
              >
                <Link to={`/knowledge/${article.id}`} className="flex-1">
                  <p className="font-medium">{article.title}</p>
                  <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {category && (
                      <span
                        className="rounded-md px-2 py-0.5 text-xs"
                        style={{ backgroundColor: `${category.color}20`, color: category.color ?? undefined }}
                      >
                        {category.name}
                      </span>
                    )}
                    <StatusBadge status={article.status} />
                    <span className="text-xs text-muted-foreground">{formatDate(article.updatedAt)}</span>
                  </div>
                </Link>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(article.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ArticleFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
