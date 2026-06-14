import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { RichTextEditor } from '@/components/editor'
import { contentToMarkdown, markdownToContent } from '@/utils/markdown'

interface Props {
  articleId: string
  content: Record<string, unknown>
}

export function ArticleEditor({ articleId, content }: Props) {
  const queryClient = useQueryClient()
  const markdown = contentToMarkdown(content)

  const updateMutation = useMutation({
    mutationFn: (newContent: { markdown: string }) =>
      api.articles.update(articleId, { content: newContent }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['article', articleId] }),
  })

  const handleChange = useCallback(
    (updated: string) => {
      updateMutation.mutate(markdownToContent(updated))
    },
    [updateMutation],
  )

  return (
    <RichTextEditor
      content={markdown}
      onChange={handleChange}
      placeholder="Start writing your notes…"
    />
  )
}
