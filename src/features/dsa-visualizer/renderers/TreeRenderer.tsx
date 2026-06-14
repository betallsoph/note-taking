import { cn } from '@/lib/utils'
import type { TreeState, TreeNode } from '../types/states'

function layoutTree(nodes: TreeNode[], rootId: string | null): TreeNode[] {
  if (!rootId) return nodes

  const nodeMap = new Map(nodes.map((n) => [n.id, { ...n }]))
  const root = nodeMap.get(rootId)
  if (!root) return nodes

  const levelWidth = 80
  const levelHeight = 70

  function position(id: string | null | undefined, depth: number, offset: number, span: number): number {
    if (!id) return offset
    const node = nodeMap.get(id)
    if (!node) return offset

    const center = offset + span / 2
    node.x = center * levelWidth + 40
    node.y = depth * levelHeight + 30

    const childSpan = span / 2
    if (node.left) position(node.left, depth + 1, offset, childSpan)
    if (node.right) position(node.right, depth + 1, offset + childSpan, childSpan)

    return offset
  }

  position(rootId, 0, 0, Math.pow(2, 4))
  return Array.from(nodeMap.values())
}

export function TreeRenderer({ state }: { state: TreeState }) {
  const highlights = new Set(state.highlights ?? [])
  const laid = layoutTree(state.nodes, state.rootId)
  const nodeMap = new Map(laid.map((n) => [n.id, n]))

  const edges: { from: TreeNode; to: TreeNode }[] = []
  for (const node of laid) {
    if (node.left) {
      const child = nodeMap.get(node.left)
      if (child) edges.push({ from: node, to: child })
    }
    if (node.right) {
      const child = nodeMap.get(node.right)
      if (child) edges.push({ from: node, to: child })
    }
  }

  const maxX = Math.max(...laid.map((n) => n.x ?? 0), 200)
  const maxY = Math.max(...laid.map((n) => n.y ?? 0), 200)

  return (
    <div className="relative overflow-x-auto py-4">
      {state.rotation && (
        <div className="mb-2 text-center text-sm font-medium text-primary">
          Rotation: {state.rotation}
        </div>
      )}
      <svg width={maxX + 60} height={maxY + 60} className="mx-auto">
        {edges.map(({ from, to }) => (
          <line
            key={`${from.id}-${to.id}`}
            x1={from.x}
            y1={(from.y ?? 0) + 18}
            x2={to.x}
            y2={(to.y ?? 0) - 18}
            stroke="var(--border)"
            strokeWidth={2}
          />
        ))}
        {laid.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={20}
              className={cn(
                highlights.has(node.id) ? 'fill-primary' : 'fill-card',
              )}
              stroke={highlights.has(node.id) ? 'var(--primary)' : 'var(--border)'}
              strokeWidth={2}
            />
            <text
              x={node.x}
              y={node.y! + 5}
              textAnchor="middle"
              className="fill-foreground text-xs font-mono font-medium"
              fontSize={12}
            >
              {node.value}
            </text>
            {state.variant === 'avl' && node.balance !== undefined && (
              <text
                x={node.x! + 22}
                y={node.y! - 14}
                className="fill-muted-foreground"
                fontSize={9}
              >
                b={node.balance}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}
