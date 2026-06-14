import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import type { HeapState } from '../types/states'

export function HeapRenderer({ state }: { state: HeapState }) {
  const highlights = new Set(state.highlights ?? [])

  function getPosition(index: number): { x: number; y: number } {
    const level = Math.floor(Math.log2(index + 1))
    const levelStart = Math.pow(2, level) - 1
    const posInLevel = index - levelStart
    const nodesInLevel = Math.pow(2, level)
    const x = ((posInLevel + 0.5) / nodesInLevel) * 400 + 40
    const y = level * 70 + 30
    return { x, y }
  }

  const edges: { from: number; to: number }[] = []
  state.values.forEach((_, i) => {
    const left = 2 * i + 1
    const right = 2 * i + 2
    if (left < state.values.length) edges.push({ from: i, to: left })
    if (right < state.values.length) edges.push({ from: i, to: right })
  })

  const maxY = state.values.length > 0 ? Math.floor(Math.log2(state.values.length)) * 70 + 80 : 100

  return (
    <div className="py-4">
      <p className="mb-2 text-center text-xs text-muted-foreground">
        {state.variant === 'min' ? 'Min Heap' : 'Max Heap'}
      </p>
      <svg width={480} height={maxY} className="mx-auto">
        {edges.map(({ from, to }) => {
          const f = getPosition(from)
          const t = getPosition(to)
          return (
            <line
              key={`${from}-${to}`}
              x1={f.x}
              y1={f.y + 18}
              x2={t.x}
              y2={t.y - 18}
              stroke="var(--border)"
              strokeWidth={2}
            />
          )
        })}
        {state.values.map((value, index) => {
          const pos = getPosition(index)
          return (
            <g key={index}>
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={20}
                animate={{
                  fill: highlights.has(index) ? 'var(--primary)' : 'var(--card)',
                }}
                stroke={highlights.has(index) ? 'var(--primary)' : 'var(--border)'}
                strokeWidth={2}
              />
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                className="fill-foreground font-mono text-xs font-medium"
                fontSize={12}
              >
                {value}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-1">
        {state.values.map((v, i) => (
          <span
            key={i}
            className={cn(
              'rounded px-2 py-0.5 font-mono text-xs',
              highlights.has(i) ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            [{i}]={v}
          </span>
        ))}
      </div>
    </div>
  )
}
