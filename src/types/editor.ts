import type { Editor } from '@tiptap/core'

export interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void | Promise<void>
  editable?: boolean
  placeholder?: string
  className?: string
  onImageUpload?: (file: File) => Promise<string>
  showToolbar?: boolean
  showSearch?: boolean
  autoSaveDelay?: number
}

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export interface SlashCommandItem {
  title: string
  description: string
  keywords: string[]
  icon: string
  command: (props: { editor: Editor; range: { from: number; to: number } }) => void
}

export type CalloutVariant = 'complexity' | 'interview-tip' | 'warning' | 'info'

export interface SearchState {
  query: string
  matchCount: number
  activeIndex: number
}
