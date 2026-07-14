import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { RichTextEditor } from '@/components/editor'
import { contentToMarkdown, markdownToContent } from '@/utils/markdown'

interface Props {
  noteId: string
  content: Record<string, unknown>
}

export function NoteEditor({ noteId, content }: Props) {
  const queryClient = useQueryClient()
  const markdown = contentToMarkdown(content)

  const updateMutation = useMutation({
    mutationFn: (newContent: { markdown: string }) =>
      api.notes.update(noteId, { content: newContent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['note', noteId] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    },
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
      placeholder="Write anything…"
    />
  )
}
