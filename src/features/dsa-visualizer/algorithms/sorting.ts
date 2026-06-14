import { buildSteps } from '../types/utils'
import type { ArrayState } from '../types/states'

function arr(values: number[], extra: Partial<ArrayState> = {}): ArrayState {
  return { type: 'array', values, ...extra }
}

export function generateBubbleSort() {
  const data = [5, 3, 8, 1, 2]
  const steps: ReturnType<typeof buildSteps> extends (infer S)[] ? Omit<S, 'id'>[] : never = [
    { title: 'Start', description: 'Bubble sort', state: arr([...data]) },
  ]
  const a = [...data]
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      steps.push({
        title: `Compare ${a[j]} and ${a[j + 1]}`,
        description: a[j] > a[j + 1] ? 'Swap needed' : 'No swap',
        state: arr([...a], { highlights: [j, j + 1], swapped: a[j] > a[j + 1] ? [j, j + 1] : undefined }),
      })
      if (a[j] > a[j + 1]) {
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        steps.push({
          title: 'Swapped',
          description: `Swapped positions ${j} and ${j + 1}`,
          state: arr([...a], { highlights: [j, j + 1] }),
        })
      }
    }
    steps.push({
      title: `Pass ${i + 1} complete`,
      description: `Element at index ${a.length - 1 - i} sorted`,
      state: arr([...a], { sorted: Array.from({ length: i + 1 }, (_, k) => a.length - 1 - k) }),
    })
  }
  return buildSteps(steps)
}

export function generateSelectionSort() {
  const data = [64, 25, 12, 22, 11]
  const a = [...data]
  const steps = [{ title: 'Start', description: 'Selection sort', state: arr([...a]) }]

  for (let i = 0; i < a.length; i++) {
    let minIdx = i
    for (let j = i + 1; j < a.length; j++) {
      steps.push({
        title: `Find min from index ${i}`,
        description: `Compare a[${minIdx}]=${a[minIdx]} with a[${j}]=${a[j]}`,
        state: arr([...a], { highlights: [minIdx, j], sorted: Array.from({ length: i }, (_, k) => k) }),
      })
      if (a[j] < a[minIdx]) minIdx = j
    }
    if (minIdx !== i) {
      ;[a[i], a[minIdx]] = [a[minIdx], a[i]]
      steps.push({
        title: `Swap min to index ${i}`,
        description: `Placed ${a[i]} at sorted position`,
        state: arr([...a], { highlights: [i], sorted: Array.from({ length: i + 1 }, (_, k) => k) }),
      })
    }
  }
  return buildSteps(steps)
}

export function generateInsertionSort() {
  const data = [12, 11, 13, 5, 6]
  const a = [...data]
  const steps = [{ title: 'Start', description: 'Insertion sort', state: arr([...a]) }]

  for (let i = 1; i < a.length; i++) {
    const key = a[i]
    let j = i - 1
    steps.push({
      title: `Insert a[${i}]=${key}`,
      description: 'Shift elements greater than key',
      state: arr([...a], { highlights: [i], sorted: Array.from({ length: i }, (_, k) => k) }),
    })
    while (j >= 0 && a[j] > key) {
      a[j + 1] = a[j]
      steps.push({
        title: `Shift ${a[j]}`,
        description: `Move ${a[j]} to index ${j + 1}`,
        state: arr([...a], { highlights: [j, j + 1] }),
      })
      j--
    }
    a[j + 1] = key
    steps.push({
      title: `Place ${key}`,
      description: `Inserted at index ${j + 1}`,
      state: arr([...a], { highlights: [j + 1], sorted: Array.from({ length: i + 1 }, (_, k) => k) }),
    })
  }
  return buildSteps(steps)
}

export function generateMergeSort() {
  const data = [38, 27, 43, 3, 9, 82, 10]
  const steps: { title: string; description: string; state: ReturnType<typeof arr> }[] = [
    { title: 'Start', description: 'Merge sort - divide and conquer', state: arr([...data]) },
  ]

  function mergeSort(slice: number[], start: number, end: number, working: number[]) {
    if (start >= end) return
    const mid = Math.floor((start + end) / 2)
    steps.push({
      title: `Divide [${start}..${end}]`,
      description: `Split at mid=${mid}`,
      state: arr([...working], { highlights: Array.from({ length: end - start + 1 }, (_, i) => start + i) }),
    })
    mergeSort(slice, start, mid, working)
    mergeSort(slice, mid + 1, end, working)

    const left = working.slice(start, mid + 1)
    const right = working.slice(mid + 1, end + 1)
    const merged: number[] = []
    let i = 0, j = 0
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) merged.push(left[i++])
      else merged.push(right[j++])
    }
    while (i < left.length) merged.push(left[i++])
    while (j < right.length) merged.push(right[j++])

    for (let k = 0; k < merged.length; k++) working[start + k] = merged[k]

    steps.push({
      title: `Merge [${start}..${end}]`,
      description: `Merged to [${working.slice(start, end + 1).join(', ')}]`,
      state: arr([...working], { highlights: Array.from({ length: end - start + 1 }, (_, i) => start + i) }),
    })
  }

  const working = [...data]
  mergeSort(working, 0, working.length - 1, working)
  steps.push({ title: 'Sorted', description: 'Array fully sorted', state: arr([...working], { sorted: working.map((_, i) => i) }) })
  return buildSteps(steps)
}

export function generateQuickSort() {
  const data = [8, 3, 1, 7, 0, 10, 2]
  const a = [...data]
  const steps = [{ title: 'Start', description: 'Quick sort', state: arr([...a]) }]

  function partition(low: number, high: number) {
    const pivot = a[high]
    let i = low - 1
    steps.push({
      title: `Partition [${low}..${high}]`,
      description: `Pivot = ${pivot}`,
      state: arr([...a], { highlights: [high], pointers: [{ label: 'pivot', index: high }] }),
    })
    for (let j = low; j < high; j++) {
      steps.push({
        title: `Compare a[${j}]=${a[j]}`,
        description: a[j] < pivot ? 'Less than pivot' : 'Greater or equal',
        state: arr([...a], { highlights: [j, high] }),
      })
      if (a[j] < pivot) {
        i++
        ;[a[i], a[j]] = [a[j], a[i]]
        if (i !== j) {
          steps.push({
            title: 'Swap',
            description: `Swapped indices ${i} and ${j}`,
            state: arr([...a], { highlights: [i, j] }),
          })
        }
      }
    }
    ;[a[i + 1], a[high]] = [a[high], a[i + 1]]
    steps.push({
      title: 'Pivot placed',
      description: `Pivot at index ${i + 1}`,
      state: arr([...a], { highlights: [i + 1] }),
    })
    return i + 1
  }

  function quickSort(low: number, high: number) {
    if (low < high) {
      const pi = partition(low, high)
      quickSort(low, pi - 1)
      quickSort(pi + 1, high)
    }
  }

  quickSort(0, a.length - 1)
  steps.push({ title: 'Sorted', description: 'Array fully sorted', state: arr([...a], { sorted: a.map((_, i) => i) }) })
  return buildSteps(steps)
}

export function generateHeapSort() {
  const data = [12, 11, 13, 5, 6, 7]
  const a = [...data]
  const steps = [{ title: 'Build Max Heap', description: 'Heapify array', state: arr([...a]) }]

  function heapify(n: number, i: number) {
    let largest = i
    const l = 2 * i + 1
    const r = 2 * i + 2
    if (l < n && a[l] > a[largest]) largest = l
    if (r < n && a[r] > a[largest]) largest = r
    if (largest !== i) {
      ;[a[i], a[largest]] = [a[largest], a[i]]
      steps.push({
        title: 'Heapify',
        description: `Swap ${i} and ${largest}`,
        state: arr([...a], { highlights: [i, largest] }),
      })
      heapify(n, largest)
    }
  }

  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) heapify(a.length, i)

  for (let i = a.length - 1; i > 0; i--) {
    ;[a[0], a[i]] = [a[i], a[0]]
    steps.push({
      title: 'Extract max',
      description: `Move max to index ${i}`,
      state: arr([...a], { highlights: [0, i], sorted: Array.from({ length: a.length - i }, (_, k) => a.length - 1 - k) }),
    })
    heapify(i, 0)
  }
  return buildSteps(steps)
}
