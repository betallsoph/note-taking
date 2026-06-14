import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { QueueState } from '../types/states'

export function QueueRenderer({ state }: { state: QueueState }) {
  return (
    <div className="flex flex-col items-center py-8">
      <div className="flex items-center gap-4">
        <span className="text-xs font-medium text-muted-foreground">Front</span>
        <div className="flex gap-1 rounded-lg border-2 border-dashed border-border p-3">
          {state.items.length === 0 && (
            <span className="px-8 text-xs text-muted-foreground">Empty</span>
          )}
          {state.items.map((item, index) => (
            <motion.div
              key={`${index}-${item}`}
              layout
              className={cn(
                'flex h-10 w-12 items-center justify-center rounded-md border font-mono font-medium',
                index === state.highlightIndex
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border bg-muted/50',
              )}
            >
              {item}
            </motion.div>
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground">Rear</span>
      </div>
    </div>
  )
}
