import type { VisualizationStep } from './index'

export function buildSteps(
  steps: Omit<VisualizationStep, 'id'>[],
): VisualizationStep[] {
  return steps.map((step, index) => ({
    ...step,
    id: `step-${index}`,
  }))
}
