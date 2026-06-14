import { buildSteps } from '../types/utils'
import type { HeapState } from '../types/states'

function heapState(values: number[], variant: 'min' | 'max', highlights?: number[]): HeapState {
  return { type: 'heap', values, variant, highlights }
}

function heapifyUp(arr: number[], index: number, variant: 'min' | 'max'): number[] {
  const result = [...arr]
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2)
    const shouldSwap = variant === 'min'
      ? result[index] < result[parent]
      : result[index] > result[parent]
    if (!shouldSwap) break
    ;[result[index], result[parent]] = [result[parent], result[index]]
    index = parent
  }
  return result
}

function heapifyDown(arr: number[], index: number, variant: 'min' | 'max'): number[] {
  const result = [...arr]
  const n = result.length
  while (true) {
    let extreme = index
    const left = 2 * index + 1
    const right = 2 * index + 2
    const compare = variant === 'min'
      ? (a: number, b: number) => a < b
      : (a: number, b: number) => a > b

    if (left < n && compare(result[left], result[extreme])) extreme = left
    if (right < n && compare(result[right], result[extreme])) extreme = right
    if (extreme === index) break
    ;[result[index], result[extreme]] = [result[extreme], result[index]]
    index = extreme
  }
  return result
}

export function generateHeapInsert(variant: 'min' | 'max') {
  const inserts = [10, 5, 20, 3]
  let heap: number[] = []
  const steps = [{ title: 'Empty Heap', description: `${variant === 'min' ? 'Min' : 'Max'} heap`, state: heapState([], variant) }]

  for (const val of inserts) {
    heap = [...heap, val]
    steps.push({
      title: `Insert ${val}`,
      description: `Add ${val} at end, bubble up`,
      state: heapState([...heap], variant, [heap.length - 1]),
    })
    heap = heapifyUp(heap, heap.length - 1, variant)
    steps.push({
      title: 'Heapify Up',
      description: 'Restore heap property',
      state: heapState([...heap], variant),
    })
  }
  return buildSteps(steps)
}

export function generateHeapExtract(variant: 'min' | 'max') {
  let heap = variant === 'min' ? [3, 5, 20, 10, 15] : [20, 15, 10, 5, 3]
  const extracted = heap[0]
  const steps = [
    { title: 'Heap State', description: `Root = ${extracted}`, state: heapState([...heap], variant, [0]) },
    { title: 'Extract Root', description: `Remove ${extracted}`, state: heapState([...heap], variant, [0]) },
  ]

  const last = heap[heap.length - 1]
  heap = [last, ...heap.slice(1, -1)]
  steps.push({
    title: 'Move Last to Root',
    description: `Replace root with ${last}`,
    state: heapState([...heap], variant, [0]),
  })

  heap = heapifyDown(heap, 0, variant)
  steps.push({
    title: 'Heapify Down',
    description: 'Bubble down to restore heap property',
    state: heapState([...heap], variant),
  })

  return buildSteps(steps)
}
