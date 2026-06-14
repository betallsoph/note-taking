import { buildSteps } from '../types/utils'
import type { GraphNode, GraphEdge, GraphState } from '../types/states'

const BASE_NODES: GraphNode[] = [
  { id: 'A', label: 'A', x: 80, y: 150 },
  { id: 'B', label: 'B', x: 200, y: 80 },
  { id: 'C', label: 'C', x: 200, y: 220 },
  { id: 'D', label: 'D', x: 320, y: 150 },
]

function graphState(
  nodes: GraphNode[],
  edges: GraphEdge[],
  directed: boolean,
  extra: Partial<GraphState> = {},
): GraphState {
  return { type: 'graph', nodes, edges, directed, ...extra }
}

export function generateGraphAddNode(directed: boolean) {
  return buildSteps([
    { title: 'Initial Graph', description: '3 nodes', state: graphState(BASE_NODES.slice(0, 3), [], directed) },
    { title: 'Add Node D', description: 'Insert node D at position (320, 150)', state: graphState(BASE_NODES, [], directed) },
    { title: 'Node Added', description: 'Graph now has 4 nodes', state: graphState(BASE_NODES, [], directed) },
  ])
}

export function generateGraphAddEdge(directed: boolean) {
  const edges: GraphEdge[] = []
  const toAdd: [string, string][] = directed
    ? [['A', 'B'], ['B', 'C'], ['C', 'D'], ['A', 'D']]
    : [['A', 'B'], ['B', 'C'], ['C', 'D'], ['A', 'D']]

  const steps = [{ title: 'Nodes Only', description: 'Graph without edges', state: graphState(BASE_NODES, [], directed) }]
  for (const [from, to] of toAdd) {
    edges.push({ from, to, highlight: true })
    steps.push({
      title: `Add Edge ${from}${directed ? '→' : '-'}${to}`,
      description: directed ? `Directed edge ${from} → ${to}` : `Undirected edge ${from} - ${to}`,
      state: graphState(BASE_NODES, [...edges], directed),
    })
  }
  return buildSteps(steps)
}
