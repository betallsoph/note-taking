import { type KeyboardEvent, useState } from 'react'
import { X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function normalizeTag(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._/-]/g, '')
    .slice(0, 32)
}

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function NoteTagsInput({
  tags,
  onChange,
  placeholder = 'Add tag…',
  className,
  disabled,
}: Props) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const tag = normalizeTag(raw)
    if (!tag || tags.includes(tag) || tags.length >= 20) {
      setDraft('')
      return
    }
    onChange([...tags, tag])
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(draft)
      return
    }
    if (event.key === 'Backspace' && !draft && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {tag}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
      <Input
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          if (draft.trim()) addTag(draft)
        }}
      />
    </div>
  )
}
