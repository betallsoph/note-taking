import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import Mathematics from '@tiptap/extension-mathematics'
import { createLowlight } from 'lowlight'
import cpp from 'highlight.js/lib/languages/cpp'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import go from 'highlight.js/lib/languages/go'
import sql from 'highlight.js/lib/languages/sql'
import { Markdown } from 'tiptap-markdown'
import { ComplexityBlock } from '@/extensions/ComplexityBlock'
import { InterviewTipBlock } from '@/extensions/InterviewTipBlock'
import { WarningBlock } from '@/extensions/WarningBlock'
import { InfoBlock } from '@/extensions/InfoBlock'
import { SlashCommand } from '@/extensions/SlashCommand'
import { SearchHighlight } from '@/extensions/SearchHighlight'
import { cn } from '@/lib/utils'

const CustomUnderline = Underline.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleUnderline(),
    }
  },
})

const lowlight = createLowlight()
;[cpp, java, javascript, typescript, python, go, sql].forEach((lang) => {
  lowlight.register(lang.name, lang)
})

export const EDITOR_LANGUAGES = ['cpp', 'java', 'javascript', 'typescript', 'python', 'go', 'sql'] as const

export function createEditorExtensions(options: {
  placeholder?: string
  onImageUpload?: (file: File) => Promise<string>
}) {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: { levels: [1, 2, 3, 4] },
    }),
    Placeholder.configure({
      placeholder: options.placeholder ?? 'Type / for commands…',
    }),
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'javascript',
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'editor-link' },
    }),
    CustomUnderline,
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({
      allowBase64: true,
      HTMLAttributes: { class: 'editor-image' },
    }),
    Mathematics.configure({
      katexOptions: { throwOnError: false },
    }),
    ComplexityBlock,
    InterviewTipBlock,
    WarningBlock,
    InfoBlock,
    Markdown.configure({
      html: true,
      tightLists: true,
      bulletListMarker: '-',
      transformPastedText: true,
      transformCopiedText: true,
    }),
    SlashCommand,
    SearchHighlight,
  ]
}

export const editorContentClass = cn(
  'editor-content min-h-[280px] max-w-none px-4 py-3 focus:outline-none',
  'text-foreground leading-relaxed',
)

export const editorWrapperClass = cn(
  'editor-root rounded-lg border bg-card text-card-foreground',
)

export async function resolveImageUrl(
  file: File,
  onImageUpload?: (file: File) => Promise<string>,
): Promise<string> {
  if (onImageUpload) return onImageUpload(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function insertImageFromFile(
  editor: Editor,
  url: string,
  alt = 'Image',
) {
  editor.chain().focus().setImage({ src: url, alt }).run()
}

export function handleEditorImageDrop(
  editor: Editor,
  event: DragEvent,
  onImageUpload?: (file: File) => Promise<string>,
) {
  const files = event.dataTransfer?.files
  if (!files?.length) return false
  const image = Array.from(files).find((f) => f.type.startsWith('image/'))
  if (!image) return false
  event.preventDefault()
  void resolveImageUrl(image, onImageUpload).then((url) => insertImageFromFile(editor, url, image.name))
  return true
}

export function handleEditorImagePaste(
  editor: Editor,
  event: ClipboardEvent,
  onImageUpload?: (file: File) => Promise<string>,
) {
  const items = event.clipboardData?.items
  if (!items) return false
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (!file) continue
      event.preventDefault()
      void resolveImageUrl(file, onImageUpload).then((url) => insertImageFromFile(editor, url))
      return true
    }
  }
  return false
}
