import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { LinkedListState } from '../types/states'

export function LinkedListRenderer({ state }: { state: LinkedListState }) {
  const highlights = new Set(state.highlights ?? [])
  const ordered: typeof state.nodes = []
  let current = state.headId
  const visited = new Set<string>()

  while (current && !visited.has(current)) {
    visited.add(current)
    const node = state.nodes.find((n) => n.id === current)
    if (!node) break
    ordered.push(node)
    current = node.next ?? null
  }

  return (
    <div className="flex items-center justify-center gap-0 overflow-x-auto py-8">
      {ordered.map((node, i) => (
        <div key={node.id} className="flex items-center">
          {state.variant === 'doubly' && node.prev && (
            <span className="mx-1 text-xs text-muted-foreground">←</span>
          )}
          <motion.div
            layout
            className={cn(
              'flex h-14 min-w-14 items-center justify-center rounded-lg border-2 font-mono font-medium',
              highlights.has(node.id)
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-border bg-card',
            )}
          >
            {node.value}
          </motion.div>
          {node.next && (
            <span className="mx-2 text-lg text-muted-foreground">→</span>
          )}
          {!node.next && i === ordered.length - 1 && (
            <span className="ml-2 font-mono text-xs text-muted-foreground">null</span>
          )}
        </div>
      ))}
      {ordered.length === 0 && (
        <span className="text-sm text-muted-foreground">Empty list (null)</span>
      )}
    </div>
  )
}
