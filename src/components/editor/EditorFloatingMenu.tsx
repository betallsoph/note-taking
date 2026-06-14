import type { Editor } from '@tiptap/core'
import { FloatingMenu } from '@tiptap/react'
import { Plus, TextHOne, ListBullets, Code, Quotes } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface EditorFloatingMenuProps {
  editor: Editor
}

export function EditorFloatingMenu({ editor }: EditorFloatingMenuProps) {
  return (
    <FloatingMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: 'left' }}
      className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-md"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
        aria-label="Add heading"
      >
        <TextHOne className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Add bullet list"
      >
        <ListBullets className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => editor.chain().focus().setCodeBlock().run()}
        aria-label="Add code block"
      >
        <Code className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => editor.chain().focus().setBlockquote().run()}
        aria-label="Add quote"
      >
        <Quotes className="h-4 w-4" />
      </Button>
      <span className="px-1 text-muted-foreground" aria-hidden>
        <Plus className="h-3 w-3" />
      </span>
    </FloatingMenu>
  )
}
