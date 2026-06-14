import { cn } from '@/lib/utils'
import type { SpeedMultiplier } from '../types'
import { SPEED_OPTIONS } from '../types'

interface SpeedControlProps {
  value: SpeedMultiplier
  onChange: (value: SpeedMultiplier) => void
  className?: string
}

export function SpeedControl({ value, onChange, className }: SpeedControlProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-muted-foreground">Speed</span>
      <div className="flex rounded-md border">
        {SPEED_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'px-3 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md',
              value === option.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
