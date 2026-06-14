import type { Editor } from '@tiptap/core'
import { CaretDown, CaretUp, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface EditorSearchBarProps {
  editor: Editor
  open: boolean
  onClose: () => void
}

export function EditorSearchBar({ editor, open, onClose }: EditorSearchBarProps) {
  if (!open) return null

  const storage = editor.storage.searchHighlight
  const count = storage.matchCount
  const index = storage.activeIndex

  return (
    <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2" role="search">
      <Input
        type="search"
        placeholder="Find in document…"
        className="h-8 max-w-xs"
        aria-label="Find in document"
        onChange={(e) => editor.commands.setSearchQuery(e.target.value)}
        autoFocus
      />
      <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {count > 0 ? `${index + 1} / ${count}` : 'No matches'}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.commands.findPrevious()}
        aria-label="Previous match"
      >
        <CaretUp className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => editor.commands.findNext()}
        aria-label="Next match"
      >
        <CaretDown className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          editor.commands.clearSearch()
          onClose()
        }}
        aria-label="Close search"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
