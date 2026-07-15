import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { RichTextEditor } from '@/components/editor'
import { contentToMarkdown, markdownToContent } from '@/utils/markdown'
import type { Note } from '@/types'

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
    onSuccess: (updated) => {
      queryClient.setQueryData<Note>(['note', noteId], updated)
      // Soft-refresh list metadata without forcing this editor to remount.
      queryClient.invalidateQueries({ queryKey: ['notes'], refetchType: 'none' })
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
      placeholder="Write anything…"
    />
  )
}
