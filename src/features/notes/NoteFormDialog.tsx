import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/services/api'
import { NoteTagsInput } from './NoteTagsInput'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NoteFormDialog({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: api.notes.create,
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setTitle('')
      setTags([])
      setError(null)
      onOpenChange(false)
      navigate(`/notes/${note.id}`)
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not create note')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    createMutation.mutate({
      title: title.trim() || 'Untitled',
      content: { markdown: '' },
      tags,
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setTitle('')
          setTags([])
          setError(null)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            autoFocus
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <NoteTagsInput
            tags={tags}
            onChange={setTags}
            placeholder="Tags optional — Enter to add"
          />
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create & write'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
