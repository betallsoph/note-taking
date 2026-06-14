export interface SimulationStep {
  stepIndex: number
  state: unknown
  description: string
  highlightIndices?: number[]
}

export function generateBubbleSortSteps(arr: number[]): SimulationStep[] {
  const steps: SimulationStep[] = []
  const array = [...arr]
  const n = array.length

  steps.push({
    stepIndex: 0,
    state: { array: [...array] },
    description: 'Initial array',
  })

  let stepIndex = 1
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        stepIndex: stepIndex++,
        state: { array: [...array], comparing: [j, j + 1] },
        description: `Compare ${array[j]} and ${array[j + 1]}`,
        highlightIndices: [j, j + 1],
      })

      if (array[j] > array[j + 1]) {
        ;[array[j], array[j + 1]] = [array[j + 1], array[j]]
        steps.push({
          stepIndex: stepIndex++,
          state: { array: [...array], swapped: [j, j + 1] },
          description: `Swap ${array[j + 1]} and ${array[j]}`,
          highlightIndices: [j, j + 1],
        })
      }
    }
  }

  steps.push({
    stepIndex: stepIndex,
    state: { array: [...array], sorted: true },
    description: 'Array is sorted',
  })

  return steps
}
