import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { UnionFindState } from '../types/states'

export function UnionFindRenderer({ state }: { state: UnionFindState }) {
  const highlights = new Set(state.highlights ?? [])
  const n = state.parent.length

  return (
    <div className="space-y-6 py-4">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Parent Array</p>
        <div className="flex flex-wrap gap-2">
          {state.parent.map((p, i) => (
            <motion.div
              key={i}
              layout
              className={cn(
                'flex flex-col items-center rounded-md border px-3 py-2',
                highlights.has(i) ? 'border-primary bg-primary/15' : 'border-border bg-muted/30',
              )}
            >
              <span className="text-[10px] text-muted-foreground">i={i}</span>
              <span className="font-mono text-sm font-medium">{p}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Rank Array</p>
        <div className="flex flex-wrap gap-2">
          {state.rank.map((r, i) => (
            <div
              key={i}
              className="flex flex-col items-center rounded-md border border-border bg-muted/30 px-3 py-2"
            >
              <span className="text-[10px] text-muted-foreground">i={i}</span>
              <span className="font-mono text-sm">{r}</span>
            </div>
          ))}
        </div>
      </div>

      {state.compressed && (
        <div>
          <p className="mb-2 text-xs font-medium text-primary">After Path Compression</p>
          <div className="flex flex-wrap gap-2">
            {state.compressed.map((p, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center rounded-md border px-3 py-2',
                  p !== state.parent[i] ? 'border-emerald-500 bg-emerald-500/15' : 'border-border bg-muted/30',
                )}
              >
                <span className="text-[10px] text-muted-foreground">i={i}</span>
                <span className="font-mono text-sm font-medium">{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4">
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-xs',
                state.parent[i] === i ? 'border-primary bg-primary/20' : 'border-border',
              )}
            >
              {i}
            </div>
            {state.parent[i] !== i && (
              <span className="mt-1 font-mono text-[10px] text-muted-foreground">
                → {state.parent[i]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
