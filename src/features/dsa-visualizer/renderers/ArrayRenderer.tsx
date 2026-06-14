import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { ArrayState } from '../types/states'

export function ArrayRenderer({ state }: { state: ArrayState }) {
  const highlights = new Set(state.highlights ?? [])
  const sorted = new Set(state.sorted ?? [])
  const pointers = state.pointers ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-center gap-2 py-4">
        {state.values.map((value, index) => (
          <motion.div
            key={`${index}-${value}`}
            layout
            className="flex w-14 flex-col items-center gap-2"
          >
            <motion.div
              animate={{
                height: typeof value === 'number' ? `${Math.max(value * 8, 32)}px` : '48px',
              }}
              transition={{ duration: 0.3 }}
              className={cn(
                'flex w-full items-center justify-center rounded-md border-2 font-mono text-sm font-medium',
                highlights.has(index) && 'border-primary bg-primary/20 text-primary',
                sorted.has(index) && !highlights.has(index) && 'border-emerald-500 bg-emerald-500/15',
                state.swapped?.includes(index) && 'border-amber-500 bg-amber-500/20',
                !highlights.has(index) && !sorted.has(index) && !state.swapped?.includes(index) &&
                  'border-border bg-muted/50',
              )}
            >
              {typeof value === 'number' && value <= 20 ? value : ''}
            </motion.div>
            <span className="font-mono text-xs text-muted-foreground">{value}</span>
            <span className="font-mono text-[10px] text-muted-foreground/60">[{index}]</span>
          </motion.div>
        ))}
      </div>
      {pointers.length > 0 && (
        <div className="flex justify-center gap-8">
          {pointers.map((p) => (
            <span key={p.label} className="text-xs text-primary">
              {p.label} = {p.index}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
