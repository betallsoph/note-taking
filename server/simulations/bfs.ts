import type { SimulationStep } from './bubble-sort.js'

export function generateBfsSteps(
  graph: Record<string, string[]>,
  start: string,
): SimulationStep[] {
  const steps: SimulationStep[] = []
  let stepIndex = 0
  const visited = new Set<string>()
  const queue: string[] = [start]
  const order: string[] = []

  steps.push({
    stepIndex: stepIndex++,
    state: { graph, queue: [...queue], visited: [], order: [] },
    description: `Start BFS from node ${start}`,
  })

  while (queue.length > 0) {
    const node = queue.shift()!
    if (visited.has(node)) continue

    visited.add(node)
    order.push(node)

    steps.push({
      stepIndex: stepIndex++,
      state: {
        graph,
        current: node,
        queue: [...queue],
        visited: [...visited],
        order: [...order],
      },
      description: `Visit node ${node}`,
    })

    for (const neighbor of graph[node] ?? []) {
      if (!visited.has(neighbor) && !queue.includes(neighbor)) {
        queue.push(neighbor)
        steps.push({
          stepIndex: stepIndex++,
          state: {
            graph,
            current: node,
            queue: [...queue],
            visited: [...visited],
            order: [...order],
            enqueued: neighbor,
          },
          description: `Enqueue neighbor ${neighbor}`,
        })
      }
    }
  }

  steps.push({
    stepIndex: stepIndex,
    state: { graph, visited: [...visited], order: [...order], complete: true },
    description: `BFS complete. Order: ${order.join(' → ')}`,
  })

  return steps
}
