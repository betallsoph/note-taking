import { cn } from '@/lib/utils'
import type { DecisionTreeState } from '../types/states'

const STATUS_STYLES = {
  exploring: 'border-primary bg-primary/15 text-primary',
  accepted: 'border-emerald-500 bg-emerald-500/15 text-emerald-600',
  rejected: 'border-destructive/50 bg-destructive/10 text-destructive',
  pending: 'border-border bg-muted/30 text-muted-foreground',
}

export function DecisionTreeRenderer({ state }: { state: DecisionTreeState }) {
  return (
    <div className="space-y-4 py-4">
      {state.solution && (
        <p className="text-center text-sm text-emerald-600">
          Solution: [{state.solution.join(', ')}]
        </p>
      )}
      <div className="flex flex-col items-center gap-2">
        {state.nodes
          .sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id))
          .map((node) => (
            <div key={node.id} style={{ marginLeft: node.depth * 24 }} className="flex items-center gap-2">
              <div
                className={cn(
                  'rounded-md border px-3 py-1.5 font-mono text-xs',
                  STATUS_STYLES[node.status],
                )}
              >
                {node.label}
              </div>
              {node.children.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  → {node.children.length} branch{node.children.length > 1 ? 'es' : ''}
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
