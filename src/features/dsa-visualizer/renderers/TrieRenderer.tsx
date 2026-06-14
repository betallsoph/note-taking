import { cn } from '@/lib/utils'
import type { TrieState } from '../types/states'

export function TrieRenderer({ state }: { state: TrieState }) {
  const highlights = new Set(state.highlights ?? [])
  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]))

  function layout(id: string, depth: number, offset: number): number {
    const node = nodeMap.get(id)
    if (!node) return offset

    const children = Object.values(node.children)
    if (children.length === 0) {
      node.x = offset * 50 + 30
      node.y = depth * 50 + 20
      return offset + 1
    }

    let current = offset
    for (const childId of children) {
      current = layout(childId, depth + 1, current)
    }
    const first = nodeMap.get(children[0])
    const last = nodeMap.get(children[children.length - 1])
    node.x = ((first?.x ?? 0) + (last?.x ?? 0)) / 2
    node.y = depth * 50 + 20
    return current
  }

  layout(state.rootId, 0, 0)
  const laid = Array.from(nodeMap.values())

  const edges: { from: string; to: string; char: string }[] = []
  for (const node of laid) {
    for (const [char, childId] of Object.entries(node.children)) {
      edges.push({ from: node.id, to: childId, char })
    }
  }

  const maxX = Math.max(...laid.map((n) => n.x ?? 0), 200) + 40
  const maxY = Math.max(...laid.map((n) => n.y ?? 0), 100) + 40

  return (
    <div className="py-4">
      {state.prefix && (
        <p className="mb-2 text-center text-sm text-primary">
          Prefix: &quot;{state.prefix}&quot;
        </p>
      )}
      <svg width={maxX} height={maxY} className="mx-auto">
        {edges.map(({ from, to, char }) => {
          const f = nodeMap.get(from)!
          const t = nodeMap.get(to)!
          const midX = ((f.x ?? 0) + (t.x ?? 0)) / 2
          const midY = ((f.y ?? 0) + (t.y ?? 0)) / 2
          return (
            <g key={`${from}-${to}`}>
              <line
                x1={f.x}
                y1={(f.y ?? 0) + 14}
                x2={t.x}
                y2={(t.y ?? 0) - 14}
                stroke="var(--border)"
                strokeWidth={1.5}
              />
              <text x={midX} y={midY} textAnchor="middle" fontSize={10} className="fill-muted-foreground">
                {char}
              </text>
            </g>
          )
        })}
        {laid.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={14}
              className={cn(
                highlights.has(node.id) ? 'fill-primary/30 stroke-primary' : 'fill-card stroke-border',
              )}
              strokeWidth={2}
            />
            <text
              x={node.x}
              y={(node.y ?? 0) + 4}
              textAnchor="middle"
              fontSize={node.id === state.rootId ? 8 : 10}
              className="fill-foreground font-mono"
            >
              {node.id === state.rootId ? '◇' : node.isEnd ? `${node.char}*` : node.char}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
