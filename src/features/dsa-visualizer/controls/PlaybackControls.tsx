import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlaybackControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrev: () => void
  onRestart: () => void
  canGoNext: boolean
  canGoPrev: boolean
  className?: string
}

export function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onRestart,
  canGoNext,
  canGoPrev,
  className,
}: PlaybackControlsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button variant="outline" size="icon" onClick={onRestart} aria-label="Restart">
        <ArrowCounterClockwise className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onPrev}
        disabled={!canGoPrev}
        aria-label="Previous step"
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Next step"
      >
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  )
}
