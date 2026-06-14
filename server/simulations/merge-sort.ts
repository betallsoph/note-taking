import type { SimulationStep } from './bubble-sort.js'

export function generateMergeSortSteps(arr: number[]): SimulationStep[] {
  const steps: SimulationStep[] = []
  let stepIndex = 0

  steps.push({
    stepIndex: stepIndex++,
    state: { array: [...arr], phase: 'initial' },
    description: 'Initial array',
  })

  function mergeSort(array: number[], left: number, right: number) {
    if (left >= right) return
    const mid = Math.floor((left + right) / 2)

    steps.push({
      stepIndex: stepIndex++,
      state: { array: [...array], dividing: [left, mid, right] },
      description: `Divide [${left}..${right}] at mid=${mid}`,
    })

    mergeSort(array, left, mid)
    mergeSort(array, mid + 1, right)
    merge(array, left, mid, right)
  }

  function merge(array: number[], left: number, mid: number, right: number) {
    const leftArr = array.slice(left, mid + 1)
    const rightArr = array.slice(mid + 1, right + 1)
    let i = 0,
      j = 0,
      k = left

    while (i < leftArr.length && j < rightArr.length) {
      if (leftArr[i] <= rightArr[j]) {
        array[k] = leftArr[i++]
      } else {
        array[k] = rightArr[j++]
      }
      steps.push({
        stepIndex: stepIndex++,
        state: { array: [...array], merging: [left, right], activeIndex: k },
        description: `Merge: place ${array[k]} at index ${k}`,
        highlightIndices: [k],
      })
      k++
    }

    while (i < leftArr.length) {
      array[k] = leftArr[i++]
      steps.push({
        stepIndex: stepIndex++,
        state: { array: [...array], merging: [left, right], activeIndex: k },
        description: `Copy remaining ${array[k]}`,
        highlightIndices: [k],
      })
      k++
    }

    while (j < rightArr.length) {
      array[k] = rightArr[j++]
      steps.push({
        stepIndex: stepIndex++,
        state: { array: [...array], merging: [left, right], activeIndex: k },
        description: `Copy remaining ${array[k]}`,
        highlightIndices: [k],
      })
      k++
    }
  }

  const working = [...arr]
  mergeSort(working, 0, working.length - 1)

  steps.push({
    stepIndex: stepIndex,
    state: { array: [...working], sorted: true },
    description: 'Array is sorted',
  })

  return steps
}
