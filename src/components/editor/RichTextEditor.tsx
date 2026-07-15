import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { SuggestionProps } from '@tiptap/suggestion'
import 'katex/dist/katex.min.css'
import '@/styles/editor.css'
import type { RichTextEditorProps, SlashCommandItem, AutosaveStatus } from '@/types/editor'
import {
  createEditorExtensions,
  editorContentClass,
  editorWrapperClass,
  handleEditorImageDrop,
  handleEditorImagePaste,
  handleEditorMarkdownDrop,
  handleEditorMarkdownPaste,
} from '@/utils/editorHelpers'
import { getEditorMarkdown, preprocessMarkdownForEditor } from '@/utils/markdown'
import { useEditorAutosave } from '@/hooks/useEditorAutosave'
import { Toolbar } from './Toolbar'
import { SlashCommandMenu } from './SlashCommandMenu'
import { EditorBubbleMenu } from './EditorBubbleMenu'
import { EditorFloatingMenu } from './EditorFloatingMenu'
import { EditorSearchBar } from './EditorSearchBar'
import { cn } from '@/lib/utils'

function AutosaveIndicator({ status }: { status: AutosaveStatus }) {
  if (status === 'idle') return null
  const label =
    status === 'pending' || status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'Saved'
        : status === 'error'
          ? 'Save failed'
          : ''
  if (!label) return null
  return (
    <span
      className={cn(
        'text-xs',
        status === 'error' ? 'text-destructive' : 'text-muted-foreground',
      )}
      aria-live="polite"
    >
      {label}
    </span>
  )
}

export function RichTextEditor({
  content,
  onChange,
  editable = true,
  placeholder,
  className,
  onImageUpload,
  showToolbar = true,
  showSearch = true,
  autoSaveDelay = 1000,
}: RichTextEditorProps) {
  const [draft, setDraft] = useState(content)
  const [searchOpen, setSearchOpen] = useState(false)
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashProps, setSlashProps] = useState<SuggestionProps<SlashCommandItem> | null>(null)
  const lastExternalContent = useRef(content)

  const autosaveStatus = useEditorAutosave(draft, onChange, autoSaveDelay)

  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const extensions = useMemo(
    () => createEditorExtensions({ placeholder, onImageUpload }),
    [placeholder, onImageUpload],
  )

  const editor = useEditor({
    extensions,
    content: preprocessMarkdownForEditor(content),
    editable,
    shouldRerenderOnTransaction: false,
    immediatelyRender: false,
    onCreate: ({ editor: ed }) => {
      editorRef.current = ed
    },
    onUpdate: ({ editor: ed }) => {
      setDraft(getEditorMarkdown(ed))
    },
    editorProps: {
      attributes: {
        class: editorContentClass,
        role: editable ? 'textbox' : 'document',
        'aria-multiline': 'true',
        'aria-label': editable ? 'Rich text editor' : 'Document preview',
      },
      handleDrop: (_view, event) => {
        const ed = editorRef.current
        if (!editable || !ed) return false
        if (handleEditorImageDrop(ed, event, onImageUpload)) return true
        return handleEditorMarkdownDrop(ed, event)
      },
      handlePaste: (_view, event) => {
        const ed = editorRef.current
        if (!editable || !ed) return false
        if (handleEditorImagePaste(ed, event, onImageUpload)) return true
        return handleEditorMarkdownPaste(ed, event)
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  // Only apply external content updates (e.g. refetch while unfocused).
  // Never reset from draft changes — that wiped keystrokes (content !== draft while typing).
  useEffect(() => {
    if (!editor) return
    if (content === lastExternalContent.current) return
    lastExternalContent.current = content

    // Don't clobber in-progress typing when autosave writes the query cache.
    if (editor.isFocused) return

    const current = getEditorMarkdown(editor)
    if (content === current) return

    editor.commands.setContent(preprocessMarkdownForEditor(content), false)
    setDraft(content)
  }, [content, editor])

  useEffect(() => {
    const onUpdate = (event: Event) => {
      setSlashProps((event as CustomEvent).detail as SuggestionProps<SlashCommandItem>)
      setSlashOpen(true)
    }
    const onExit = () => {
      setSlashOpen(false)
      setSlashProps(null)
    }
    window.addEventListener('slash-command-update', onUpdate)
    window.addEventListener('slash-command-exit', onExit)
    return () => {
      window.removeEventListener('slash-command-update', onUpdate)
      window.removeEventListener('slash-command-exit', onExit)
    }
  }, [])

  const toggleSearch = useCallback(() => {
    setSearchOpen((v) => {
      if (v && editor) editor.commands.clearSearch()
      return !v
    })
  }, [editor])

  if (!editor) {
    return (
      <div className={cn(editorWrapperClass, className, 'animate-pulse p-6')}>
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="mt-4 h-4 w-full rounded bg-muted" />
        <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
      </div>
    )
  }

  return (
    <div className={cn(editorWrapperClass, !editable && 'editor-readonly', className)}>
      {editable && showToolbar && (
        <Toolbar editor={editor} onSearchToggle={showSearch ? toggleSearch : undefined} />
      )}
      {editable && showSearch && (
        <EditorSearchBar editor={editor} open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
      <div className="relative">
        {editable && <EditorBubbleMenu editor={editor} />}
        {editable && <EditorFloatingMenu editor={editor} />}
        <EditorContent editor={editor} />
        {editable && slashOpen && <SlashCommandMenu open={slashOpen} props={slashProps} />}
      </div>
      {editable && (
        <div className="flex items-center justify-between border-t px-3 py-1.5">
          <span className="text-xs text-muted-foreground">
            Type <kbd className="rounded border px-1 font-mono">/</kbd> for commands
          </span>
          <AutosaveIndicator status={autosaveStatus} />
        </div>
      )}
    </div>
  )
}
