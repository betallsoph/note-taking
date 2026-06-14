import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { VisualizationStep } from '../types'
import { PlaybackControls } from '../controls/PlaybackControls'
import { TimelineSlider } from '../controls/TimelineSlider'
import { SpeedControl } from '../controls/SpeedControl'
import type { SpeedMultiplier } from '../types'

interface StepDescriptionPanelProps {
  step: VisualizationStep | null
  currentIndex: number
  totalSteps: number
  isPlaying: boolean
  speedMultiplier: SpeedMultiplier
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrev: () => void
  onRestart: () => void
  onGoTo: (index: number) => void
  onSpeedChange: (speed: SpeedMultiplier) => void
  steps: VisualizationStep[]
}

export function StepDescriptionPanel({
  step,
  currentIndex,
  totalSteps,
  isPlaying,
  speedMultiplier,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onRestart,
  onGoTo,
  onSpeedChange,
  steps,
}: StepDescriptionPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Step Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            {step?.description ?? 'Select a visualization to begin'}
          </p>

          <TimelineSlider
            currentIndex={currentIndex}
            totalSteps={totalSteps}
            onChange={onGoTo}
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <PlaybackControls
              isPlaying={isPlaying}
              onPlay={onPlay}
              onPause={onPause}
              onNext={onNext}
              onPrev={onPrev}
              onRestart={onRestart}
              canGoNext={currentIndex < totalSteps - 1}
              canGoPrev={currentIndex > 0}
            />
            <SpeedControl value={speedMultiplier} onChange={onSpeedChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Step Log</CardTitle>
        </CardHeader>
        <CardContent className="max-h-48 space-y-0.5 overflow-y-auto">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onGoTo(i)}
              className={`block w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                i === currentIndex
                  ? 'bg-primary/15 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <span className="font-mono text-[10px] opacity-60">{i + 1}.</span> {s.description}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
