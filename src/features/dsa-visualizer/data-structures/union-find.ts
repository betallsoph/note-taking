import { buildSteps } from '../types/utils'
import type { UnionFindState } from '../types/states'

function ufState(
  parent: number[],
  rank: number[],
  highlights?: number[],
  compressed?: number[],
): UnionFindState {
  return { type: 'union-find', parent, rank, highlights, compressed }
}

function find(parent: number[], x: number): number {
  if (parent[x] !== x) return find(parent, parent[x])
  return parent[x]
}

function findWithCompression(parent: number[], x: number): { root: number; compressed: number[] } {
  const p = [...parent]
  const path: number[] = []
  let curr = x
  while (p[curr] !== curr) {
    path.push(curr)
    curr = p[curr]
  }
  for (const node of path) p[node] = curr
  return { root: curr, compressed: p }
}

export function generateUnionFindFind() {
  const parent = [0, 1, 2, 3, 1, 5, 6, 7, 8]
  const rank = [2, 3, 1, 1, 0, 1, 0, 0, 0]
  const target = 4

  const steps = [
    { title: 'Initial State', description: `Find representative of set containing ${target}`, state: ufState(parent, rank) },
    { title: `Start at ${target}`, description: `parent[${target}] = ${parent[target]}`, state: ufState(parent, rank, [target]) },
    { title: `Follow to ${parent[target]}`, description: `parent[${parent[target]}] = ${parent[parent[target]]}`, state: ufState(parent, rank, [target, parent[target]]) },
    { title: 'Reach Root', description: `Root is ${find(parent, target)}`, state: ufState(parent, rank, [1]) },
  ]

  const { compressed } = findWithCompression(parent, target)
  steps.push({
    title: 'Path Compression',
    description: `Flatten path: all nodes point directly to root ${find(parent, target)}`,
    state: ufState(parent, rank, [target, parent[target], 1], compressed),
  })

  return buildSteps(steps)
}

export function generateUnionFindUnion() {
  let parent = [0, 1, 2, 3, 4, 5, 6, 7]
  let rank = [1, 1, 1, 1, 1, 1, 1, 1]
  const x = 3
  const y = 7

  const steps = [
    { title: 'Initial Sets', description: 'Each element in its own set', state: ufState([...parent], [...rank]) },
    { title: `Find(${x})`, description: `Root of ${x} is ${find(parent, x)}`, state: ufState([...parent], [...rank], [x, find(parent, x)]) },
    { title: `Find(${y})`, description: `Root of ${y} is ${find(parent, y)}`, state: ufState([...parent], [...rank], [y, find(parent, y)]) },
  ]

  const rootX = find(parent, x)
  const rootY = find(parent, y)
  if (rank[rootX] < rank[rootY]) {
    parent[rootX] = rootY
  } else if (rank[rootX] > rank[rootY]) {
    parent[rootY] = rootX
  } else {
    parent[rootY] = rootX
    rank[rootX]++
  }

  steps.push({
    title: 'Union by Rank',
    description: `Merge sets: parent[${rootY}] = ${rootX}`,
    state: ufState([...parent], [...rank], [rootX, rootY]),
  })

  return buildSteps(steps)
}
