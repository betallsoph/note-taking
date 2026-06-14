import { cn } from '@/lib/utils'

interface TimelineSliderProps {
  currentIndex: number
  totalSteps: number
  onChange: (index: number) => void
  className?: string
}

export function TimelineSlider({
  currentIndex,
  totalSteps,
  onChange,
  className,
}: TimelineSliderProps) {
  const max = Math.max(totalSteps - 1, 0)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Timeline</span>
        <span>
          Step {currentIndex + 1} of {totalSteps}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={currentIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
        disabled={totalSteps <= 1}
      />
      <div className="flex justify-between">
        {Array.from({ length: totalSteps }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              'h-1.5 flex-1 mx-px rounded-full transition-colors',
              i <= currentIndex ? 'bg-primary' : 'bg-muted',
            )}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
