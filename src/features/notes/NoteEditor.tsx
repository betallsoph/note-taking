import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { RichTextEditor } from '@/components/editor'
import { contentToMarkdown, markdownToContent } from '@/utils/markdown'
import { CreateFlashcardDialog, type FlashcardDraft } from '@/features/flashcards/CreateFlashcardDialog'
import type { Note } from '@/types'

interface Props {
  noteId: string
  content: Record<string, unknown>
  noteTitle?: string
  noteTags?: string[]
}

export function NoteEditor({ noteId, content, noteTitle, noteTags }: Props) {
  const queryClient = useQueryClient()
  const markdown = contentToMarkdown(content)
  const [flashcardOpen, setFlashcardOpen] = useState(false)
  const [draft, setDraft] = useState<FlashcardDraft | null>(null)

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

  const openFlashcardFromSelection = useCallback((selectedText: string) => {
    const lines = selectedText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    const question = lines[0] ?? selectedText
    const answer = lines.length > 1 ? lines.slice(1).join('\n') : ''
    setDraft({
      question,
      answer,
      sourceNoteId: noteId,
    })
    setFlashcardOpen(true)
  }, [noteId])

  return (
    <>
      <RichTextEditor
        content={markdown}
        onChange={handleChange}
        placeholder="Write anything…"
        onAddFlashcard={openFlashcardFromSelection}
      />
      <CreateFlashcardDialog
        open={flashcardOpen}
        onOpenChange={setFlashcardOpen}
        draft={draft}
        noteTags={noteTags}
        title={noteTitle ? `Flashcard from “${noteTitle}”` : 'Add flashcard from note'}
      />
    </>
  )
}
