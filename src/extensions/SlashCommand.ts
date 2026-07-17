import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import type { SlashCommandItem } from '@/types/editor'

export const slashCommandItems: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section title',
    keywords: ['heading', 'h1', 'title'],
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section title',
    keywords: ['heading', 'h2', 'section'],
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Subsection title',
    keywords: ['heading', 'h3'],
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    title: 'Table',
    description: 'Insert a data table',
    keywords: ['table', 'grid'],
    icon: 'Table',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run()
    },
  },
  {
    title: 'Code Block',
    description: 'Syntax-highlighted code',
    keywords: ['code', 'snippet'],
    icon: 'Code',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock({ language: 'javascript' }).run()
    },
  },
  {
    title: 'Image',
    description: 'Upload or paste an image',
    keywords: ['image', 'photo', 'picture'],
    icon: 'Image',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
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
    },
  },
  {
    title: 'Quote',
    description: 'Blockquote for citations',
    keywords: ['quote', 'blockquote'],
    icon: 'Quote',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setBlockquote().run()
    },
  },
  {
    title: 'Checklist',
    description: 'Task list with checkboxes',
    keywords: ['checklist', 'todo', 'task'],
    icon: 'Check',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal rule separator',
    keywords: ['divider', 'hr', 'line'],
    icon: 'Minus',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'Callout',
    description: 'Info callout block',
    keywords: ['callout', 'info', 'note'],
    icon: 'Info',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: 'infoBlock', content: [{ type: 'paragraph' }] })
        .run()
    },
  },
  {
    title: 'Complexity',
    description: 'Time and space complexity card',
    keywords: ['complexity', 'big-o', 'time', 'space'],
    icon: 'Chart',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({
          type: 'complexityBlock',
          attrs: { timeComplexity: 'O(n)', spaceComplexity: 'O(1)' },
        })
        .run()
    },
  },
  {
    title: 'Math',
    description: 'Inline LaTeX formula',
    keywords: ['math', 'latex', 'formula'],
    icon: 'Math',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertContent('$O(n \\log n)$').run()
    },
  },
  {
    title: 'Dev Vault link',
    description: 'Link to a credential in Dev Vault',
    keywords: ['vault', 'credential', 'secret', 'api', 'dev'],
    icon: 'Key',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      window.dispatchEvent(
        new CustomEvent('dev-vault-insert-request', { detail: { editor } }),
      )
    },
  },
]

declare module '@tiptap/core' {
  interface Storage {
    slashCommand: {
      items: SlashCommandItem[]
    }
  }
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addStorage() {
    return { items: slashCommandItems }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        command: ({ editor, range, props }) => {
          props.command({ editor, range })
        },
        items: ({ query }) => {
          const q = query.toLowerCase()
          return slashCommandItems.filter(
            (item) =>
              item.title.toLowerCase().includes(q) ||
              item.keywords.some((k) => k.includes(q)),
          )
        },
        render: () => {
          let host: HTMLElement | null = null

          return {
            onStart: (props) => {
              host = document.createElement('div')
              host.className = 'slash-command-host'
              document.body.appendChild(host)
              window.dispatchEvent(
                new CustomEvent('slash-command-update', { detail: props }),
              )
            },
            onUpdate: (props) => {
              window.dispatchEvent(
                new CustomEvent('slash-command-update', { detail: props }),
              )
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                host?.remove()
                host = null
                return true
              }
              window.dispatchEvent(
                new CustomEvent('slash-command-keydown', { detail: props }),
              )
              return false
            },
            onExit: () => {
              host?.remove()
              host = null
              window.dispatchEvent(new CustomEvent('slash-command-exit'))
            },
          }
        },
      }),
    ]
  },
})
