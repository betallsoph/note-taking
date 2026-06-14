import { buildSteps } from '../types/utils'
import type { ArrayState } from '../types/states'

function arr(values: number[], extra: Partial<ArrayState> = {}): ArrayState {
  return { type: 'array', values, ...extra }
}

export function generateLinearSearch() {
  const data = [4, 2, 7, 1, 9, 3]
  const target = 7
  const steps = [{ title: 'Start', description: `Linear search for ${target}`, state: arr([...data]) }]
  for (let i = 0; i < data.length; i++) {
    steps.push({
      title: `Check index ${i}`,
      description: data[i] === target ? `Found at index ${i}` : `${data[i]} ≠ ${target}`,
      state: arr([...data], { highlights: [i], pointers: [{ label: 'i', index: i }] }),
    })
    if (data[i] === target) break
  }
  return buildSteps(steps)
}

export function generateBinarySearch() {
  const data = [1, 3, 5, 7, 9, 11, 13]
  const target = 7
  let lo = 0
  let hi = data.length - 1
  const steps = [{ title: 'Sorted Array', description: `Binary search for ${target}`, state: arr([...data]) }]

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    steps.push({
      title: `lo=${lo}, hi=${hi}, mid=${mid}`,
      description: `Compare arr[${mid}]=${data[mid]} with ${target}`,
      state: arr([...data], {
        highlights: [mid],
        pointers: [
          { label: 'lo', index: lo },
          { label: 'mid', index: mid },
          { label: 'hi', index: hi },
        ],
      }),
    })
    if (data[mid] === target) break
    if (data[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return buildSteps(steps)
}
