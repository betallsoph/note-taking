import { useState, useMemo, useCallback } from 'react'
import { PageHeader } from '@/components/ui/misc'
import { useVisualizationPlayer } from '../hooks/useVisualizationPlayer'
import { VISUALIZER_REGISTRY } from '../config/registry'
import type { VisualizerConfig } from '../types'
import { VisualizationSidebar } from './VisualizationSidebar'
import { VisualizationCanvas } from './VisualizationCanvas'
import { StepDescriptionPanel } from './StepDescriptionPanel'

export function DsaVisualizerPage() {
  const [selectedConfig, setSelectedConfig] = useState<VisualizerConfig>(
    VISUALIZER_REGISTRY[0],
  )

  const steps = useMemo(
    () => selectedConfig.generate(),
    [selectedConfig],
  )

  const player = useVisualizationPlayer(steps)

  const handleSelect = useCallback((config: VisualizerConfig) => {
    setSelectedConfig(config)
  }, [])

  return (
    <div className="flex min-h-[calc(100dvh-6.5rem)] flex-col">
      <PageHeader
        title="DSA Visualizer"
        className="mb-4 shrink-0"
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 rounded-lg border lg:grid-cols-[260px_1fr]">
        <VisualizationSidebar
          selectedId={selectedConfig.id}
          onSelect={handleSelect}
          className="hidden lg:flex"
        />

        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="shrink-0 border-b px-4 py-2 lg:hidden">
            <select
              value={selectedConfig.id}
              onChange={(e) => {
                const config = VISUALIZER_REGISTRY.find((v) => v.id === e.target.value)
                if (config) handleSelect(config)
              }}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {VISUALIZER_REGISTRY.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <VisualizationCanvas
              step={player.currentStep}
              rendererType={selectedConfig.rendererType}
              title={selectedConfig.title}
            />

            <StepDescriptionPanel
              step={player.currentStep}
              currentIndex={player.currentIndex}
              totalSteps={player.totalSteps}
              isPlaying={player.isPlaying}
              speedMultiplier={player.speedMultiplier}
              onPlay={player.play}
              onPause={player.pause}
              onNext={player.next}
              onPrev={player.prev}
              onRestart={player.restart}
              onGoTo={player.goTo}
              onSpeedChange={player.setSpeedMultiplier}
              steps={steps}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
