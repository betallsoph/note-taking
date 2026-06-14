import { cn } from '@/lib/utils'
import type { GraphState } from '../types/states'

export function GraphRenderer({ state }: { state: GraphState }) {
  const visited = new Set(state.visited ?? [])
  const path = new Set(state.path ?? [])
  const mst = new Set(state.mstEdges ?? [])
  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]))

  return (
    <div className="relative min-h-[320px] py-4">
      <svg className="absolute inset-0 h-full w-full">
        {state.edges.map((edge) => {
          const from = nodeMap.get(edge.from)
          const to = nodeMap.get(edge.to)
          if (!from || !to) return null
          const edgeKey = `${edge.from}-${edge.to}`
          const isMst = mst.has(edgeKey) || mst.has(`${edge.to}-${edge.from}`)
          const isHighlight = edge.highlight || isMst
          return (
            <g key={edgeKey}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isHighlight ? 'var(--primary)' : 'var(--border)'}
                strokeWidth={isHighlight ? 3 : 2}
              />
              {state.directed && (
                <polygon
                  points={`${to.x},${to.y} ${to.x - 8},${to.y - 4} ${to.x - 8},${to.y + 4}`}
                  fill={isHighlight ? 'var(--primary)' : 'var(--border)'}
                />
              )}
              {edge.weight !== undefined && (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 6}
                  textAnchor="middle"
                  fontSize={10}
                  className="fill-muted-foreground"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {state.nodes.map((node) => (
        <div
          key={node.id}
          className={cn(
            'absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-mono text-sm font-medium transition-colors',
            state.current === node.id && 'border-primary bg-primary text-primary-foreground',
            visited.has(node.id) && state.current !== node.id && 'border-emerald-500 bg-emerald-500/15 text-emerald-600',
            path.has(node.id) && !visited.has(node.id) && 'border-amber-500 bg-amber-500/15',
            !visited.has(node.id) && state.current !== node.id && !path.has(node.id) && 'border-border bg-card',
          )}
          style={{ left: node.x, top: node.y }}
        >
          {node.label}
        </div>
      ))}

      {state.distances && Object.keys(state.distances).length > 0 && (
        <div className="absolute bottom-0 left-0 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {Object.entries(state.distances).map(([id, dist]) => (
            <span key={id}>
              {id}: {dist === Infinity ? '∞' : dist}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
