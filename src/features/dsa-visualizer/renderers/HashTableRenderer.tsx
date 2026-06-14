import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { HashTableState } from '../types/states'

export function HashTableRenderer({ state }: { state: HashTableState }) {
  return (
    <div className="grid gap-3 py-4" style={{ gridTemplateColumns: `repeat(${Math.min(state.bucketCount, 5)}, 1fr)` }}>
      {state.buckets.map((bucket, bucketIndex) => (
        <div key={bucketIndex} className="space-y-1">
          <span className="font-mono text-[10px] text-muted-foreground">Bucket {bucketIndex}</span>
          <div className="min-h-[80px] rounded-lg border-2 border-dashed border-border p-2">
            {bucket.filter(Boolean).map((entry, i) => {
              if (!entry) return null
              const isHighlight = state.highlightKey === entry.key
              const isCollision = state.collisionKeys?.includes(entry.key)
              return (
                <motion.div
                  key={`${entry.key}-${i}`}
                  layout
                  className={cn(
                    'mb-1 rounded px-2 py-1 font-mono text-xs',
                    isHighlight && 'bg-primary/20 text-primary ring-1 ring-primary',
                    isCollision && !isHighlight && 'bg-amber-500/15 text-amber-600',
                    !isHighlight && !isCollision && 'bg-muted/50',
                  )}
                >
                  {entry.key}:{entry.value}
                </motion.div>
              )
            })}
            {bucket.every((e) => !e) && (
              <span className="text-[10px] text-muted-foreground">empty</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
