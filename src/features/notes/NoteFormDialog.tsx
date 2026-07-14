import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/services/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NoteFormDialog({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: api.notes.create,
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setTitle('')
      setError(null)
      onOpenChange(false)
      navigate(`/notes/${note.id}`)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Could not create note')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    createMutation.mutate({
      title: title.trim() || 'Untitled',
      content: { markdown: '' },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setTitle('')
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
          {error && <p className="text-sm text-rose-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create & write'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
