import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { RichTextEditor } from '@/components/editor'
import { contentToMarkdown, markdownToContent } from '@/utils/markdown'
import type { PlannerItem } from '@/types'

interface Props {
  plannerId: string
  content: Record<string, unknown>
}

export function PlannerEditor({ plannerId, content }: Props) {
  const queryClient = useQueryClient()
  const markdown = contentToMarkdown(content)

  const updateMutation = useMutation({
    mutationFn: (newContent: { markdown: string }) =>
      api.planner.update(plannerId, { content: newContent }),
    onSuccess: (updated) => {
      queryClient.setQueryData<PlannerItem>(['planner-item', plannerId], updated)
      queryClient.invalidateQueries({ queryKey: ['planner'], refetchType: 'none' })
    },
  })

  const handleChange = useCallback(
    async (updated: string) => {
      await updateMutation.mutateAsync(markdownToContent(updated))
    },
    [updateMutation],
  )

  return (
    <RichTextEditor
      content={markdown}
      onChange={handleChange}
      placeholder="Add details, notes, or next steps…"
    />
  )
}
