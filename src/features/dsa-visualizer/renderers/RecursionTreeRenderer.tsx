import { cn } from '@/lib/utils'
import type { RecursionTreeState } from '../types/states'

const STATUS_COLORS = {
  active: 'border-primary bg-primary/20 text-primary',
  returning: 'border-emerald-500 bg-emerald-500/15 text-emerald-600',
  base: 'border-amber-500 bg-amber-500/15 text-amber-600',
  pending: 'border-border bg-muted/30 text-muted-foreground',
}

export function RecursionTreeRenderer({ state }: { state: RecursionTreeState }) {
  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]))

  function layout(id: string, depth: number, offset: number): number {
    const node = nodeMap.get(id)
    if (!node) return offset

    if (node.children.length === 0) {
      ;(node as { x?: number; y?: number }).x = offset * 120 + 60
      ;(node as { x?: number; y?: number }).y = depth * 60 + 20
      return offset + 1
    }

    let current = offset
    for (const childId of node.children) {
      current = layout(childId, depth + 1, current)
    }
    const first = nodeMap.get(node.children[0]) as { x?: number }
    const last = nodeMap.get(node.children[node.children.length - 1]) as { x?: number }
    ;(node as { x?: number; y?: number }).x = ((first?.x ?? 0) + (last?.x ?? 0)) / 2
    ;(node as { x?: number; y?: number }).y = depth * 60 + 20
    return current
  }

  layout(state.rootId, 0, 0)
  const laid = Array.from(nodeMap.values()) as Array<typeof state.nodes[0] & { x?: number; y?: number }>

  const maxX = Math.max(...laid.map((n) => n.x ?? 0), 200) + 80
  const maxY = Math.max(...laid.map((n) => n.y ?? 0), 100) + 40

  return (
    <div className="space-y-4 py-4">
      {state.callStack && state.callStack.length > 0 && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Call stack:</span>
          {state.callStack.map((call, i) => (
            <span key={i} className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
              {call}
            </span>
          ))}
        </div>
      )}
      <svg width={maxX} height={maxY} className="mx-auto">
        {laid.flatMap((node) =>
          node.children.map((childId) => {
            const child = nodeMap.get(childId) as { x?: number; y?: number }
            return (
              <line
                key={`${node.id}-${childId}`}
                x1={node.x}
                y1={(node.y ?? 0) + 16}
                x2={child?.x}
                y2={(child?.y ?? 0) - 16}
                stroke="var(--border)"
                strokeWidth={1.5}
              />
            )
          }),
        )}
      </svg>
      <div className="relative" style={{ width: maxX, height: maxY, margin: '0 auto' }}>
        {laid.map((node) => (
          <div
            key={node.id}
            className={cn(
              'absolute -translate-x-1/2 rounded-md border px-2 py-1 font-mono text-[10px] whitespace-nowrap',
              STATUS_COLORS[node.status],
            )}
            style={{ left: node.x, top: node.y }}
          >
            {node.label}
            {node.result !== undefined && (
              <span className="ml-1 text-emerald-600">= {node.result}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
