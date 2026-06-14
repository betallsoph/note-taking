import { useEffect, useState, useCallback } from 'react'
import type { SuggestionProps } from '@tiptap/suggestion'
import type { SlashCommandItem } from '@/types/editor'
import { cn } from '@/lib/utils'

interface SlashCommandMenuProps {
  open: boolean
  props: SuggestionProps<SlashCommandItem> | null
}

export function SlashCommandMenu({ open, props }: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const items = props?.items ?? []

  useEffect(() => {
    setSelectedIndex(0)
  }, [items.length, props?.query])

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index]
      if (item && props) {
        props.command(item)
      }
    },
    [items, props],
  )

  useEffect(() => {
    const onKeyDown = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        event: KeyboardEvent
      }
      if (!open || !detail?.event) return
      if (detail.event.key === 'ArrowUp') {
        detail.event.preventDefault()
        setSelectedIndex((i) => (i + items.length - 1) % items.length)
      }
      if (detail.event.key === 'ArrowDown') {
        detail.event.preventDefault()
        setSelectedIndex((i) => (i + 1) % items.length)
      }
      if (detail.event.key === 'Enter') {
        detail.event.preventDefault()
        selectItem(selectedIndex)
      }
    }
    window.addEventListener('slash-command-keydown', onKeyDown)
    return () => window.removeEventListener('slash-command-keydown', onKeyDown)
  }, [open, items.length, selectedIndex, selectItem])

  if (!open || !props || items.length === 0) return null

  return (
    <div
      className="slash-command-menu z-50 max-h-72 w-72 overflow-auto rounded-lg border bg-popover p-1 shadow-lg"
      style={{
        position: 'fixed',
        left: props.clientRect?.()?.left ?? 0,
        top: (props.clientRect?.()?.bottom ?? 0) + 4,
      }}
      role="listbox"
      aria-label="Slash commands"
    >
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          role="option"
          aria-selected={index === selectedIndex}
          className={cn(
            'flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
            index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
          )}
          onClick={() => selectItem(index)}
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted font-mono text-[10px] font-bold">
            {item.icon.slice(0, 2)}
          </span>
          <span>
            <span className="block font-medium">{item.title}</span>
            <span className="block text-xs text-muted-foreground">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
