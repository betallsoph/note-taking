import { cn } from '@/lib/utils'
import type { DpTableState } from '../types/states'

export function DpTableRenderer({ state }: { state: DpTableState }) {
  const filled = new Set(
    (state.filledCells ?? []).map(([r, c]) => `${r},${c}`),
  )
  const [hiR, hiC] = state.highlightCell ?? [-1, -1]

  return (
    <div className="overflow-x-auto py-4">
      <table className="mx-auto border-collapse">
        <thead>
          <tr>
            <th className="border border-border bg-muted/50 px-3 py-2 text-xs" />
            {(state.colLabels ?? state.table[0]?.map((_, i) => String(i)) ?? []).map(
              (label, i) => (
                <th
                  key={i}
                  className="border border-border bg-muted/50 px-3 py-2 font-mono text-xs"
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {state.table.map((row, ri) => (
            <tr key={ri}>
              <th className="border border-border bg-muted/50 px-3 py-2 font-mono text-xs">
                {state.rowLabels?.[ri] ?? ri}
              </th>
              {row.map((cell, ci) => {
                const key = `${ri},${ci}`
                const isHighlight = ri === hiR && ci === hiC
                const isFilled = filled.has(key)
                return (
                  <td
                    key={ci}
                    className={cn(
                      'border border-border px-4 py-3 text-center font-mono text-sm transition-colors',
                      isHighlight && 'bg-primary/25 text-primary ring-2 ring-primary',
                      isFilled && !isHighlight && 'bg-emerald-500/10 text-emerald-700',
                      !isHighlight && !isFilled && 'bg-card',
                    )}
                  >
                    {cell ?? '-'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
