import { cn } from '@/lib/utils'
import type { StringMatchState } from '../types/states'

function highlightRange(
  str: string,
  highlights: StringMatchState['highlights'],
  target: 'text' | 'pattern',
) {
  const ranges = (highlights ?? []).filter((h) => h.target === target)
  return str.split('').map((char, i) => {
    const active = ranges.some((r) => i >= r.start && i < r.end)
    const match = ranges.some((r) => r.start === i)
    return (
      <span
        key={i}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded font-mono text-sm',
          active ? 'bg-primary/25 text-primary ring-1 ring-primary' : 'bg-muted/50',
          match && 'bg-emerald-500/20 text-emerald-600',
        )}
      >
        {char}
      </span>
    )
  })
}

export function StringMatchRenderer({ state }: { state: StringMatchState }) {
  return (
    <div className="space-y-6 py-4">
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Text (i={state.textIndex})</p>
        <div className="flex flex-wrap gap-1">
          {highlightRange(state.text, state.highlights, 'text')}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Pattern (j={state.patternIndex})</p>
        <div className="flex flex-wrap gap-1">
          {highlightRange(state.pattern, state.highlights, 'pattern')}
        </div>
      </div>
      {state.lps && (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">LPS Array</p>
          <div className="flex gap-1">
            {state.lps.map((v, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-mono text-xs text-muted-foreground">{state.pattern[i]}</span>
                <span className="rounded bg-muted px-2 py-1 font-mono text-xs">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {state.hash !== undefined && (
        <p className="text-center font-mono text-sm text-muted-foreground">
          Rolling hash: {state.hash}
        </p>
      )}
      {state.matches && state.matches.length > 0 && (
        <p className="text-center text-sm text-emerald-600">
          Matches at indices: {state.matches.join(', ')}
        </p>
      )}
    </div>
  )
}
