import type { Editor } from '@tiptap/core'
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  Code,
  ListBullets,
  ListNumbers,
  Checks,
  Quotes,
  Minus,
  Table,
  Image,
  Link as LinkIcon,
  Key,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EDITOR_LANGUAGES } from '@/utils/editorHelpers'

interface ToolbarProps {
  editor: Editor
  onSearchToggle?: () => void
  onInsertVaultLink?: () => void
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      className={cn('h-8 w-8 shrink-0', active && 'bg-accent')}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {children}
    </Button>
  )
}

export function Toolbar({ editor, onSearchToggle, onInsertVaultLink }: ToolbarProps) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        editor.chain().focus().setImage({ src: reader.result as string, alt: file.name }).run()
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return (
    <div
      className="editor-toolbar flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5"
      role="toolbar"
      aria-label="Formatting toolbar"
    >
      <ToolbarButton
        title="Bold (Ctrl+B)"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TextB className="h-4 w-4" weight="bold" />
      </ToolbarButton>
      <ToolbarButton
        title="Italic (Ctrl+I)"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TextItalic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Underline (Ctrl+U)"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <TextUnderline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <TextStrikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Inline code"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      {[1, 2, 3, 4].map((level) => (
        <ToolbarButton
          key={level}
          title={`Heading ${level}`}
          active={editor.isActive('heading', { level })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 }).run()
          }
        >
          <span className="text-xs font-bold">H{level}</span>
        </ToolbarButton>
      ))}

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        title="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListBullets className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Ordered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListNumbers className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Task list"
        active={editor.isActive('taskList')}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
      >
        <Checks className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Blockquote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quotes className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <ToolbarButton
        title="Insert table"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
      >
        <Table className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Insert image" onClick={insertImage}>
        <Image className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Insert link" active={editor.isActive('link')} onClick={setLink}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      {onInsertVaultLink && (
        <ToolbarButton title="Insert Dev Vault link" onClick={onInsertVaultLink}>
          <Key className="h-4 w-4" weight="duotone" />
        </ToolbarButton>
      )}

      <span className="mx-1 h-5 w-px bg-border" aria-hidden />

      <select
        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        aria-label="Code block language"
        defaultValue="javascript"
        onChange={(e) => {
          editor.chain().focus().setCodeBlock({ language: e.target.value }).run()
        }}
      >
        {EDITOR_LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>

      {onSearchToggle && (
        <>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <ToolbarButton title="Find in document" onClick={onSearchToggle}>
            <MagnifyingGlass className="h-4 w-4" />
          </ToolbarButton>
        </>
      )}
    </div>
  )
}
