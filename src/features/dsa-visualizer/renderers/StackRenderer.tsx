import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { StackState } from '../types/states'

export function StackRenderer({ state }: { state: StackState }) {
  return (
    <div className="flex flex-col items-center py-8">
      <span className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Top
      </span>
      <div className="flex w-32 flex-col-reverse gap-1 rounded-lg border-2 border-dashed border-border p-2">
        {state.items.length === 0 && (
          <span className="py-8 text-center text-xs text-muted-foreground">Empty</span>
        )}
        {state.items.map((item, index) => (
          <motion.div
            key={`${index}-${item}`}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'flex h-10 items-center justify-center rounded-md border font-mono font-medium',
              index === state.highlightIndex
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-border bg-muted/50',
            )}
          >
            {item}
          </motion.div>
        ))}
      </div>
      <span className="mt-2 text-xs text-muted-foreground">Bottom</span>
    </div>
  )
}
