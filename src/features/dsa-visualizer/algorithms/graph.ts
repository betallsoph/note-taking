import { buildSteps } from '../types/utils'
import type { GraphNode, GraphEdge, GraphState } from '../types/states'

const NODES: GraphNode[] = [
  { id: 'A', label: 'A', x: 60, y: 150 },
  { id: 'B', label: 'B', x: 160, y: 80 },
  { id: 'C', label: 'C', x: 160, y: 220 },
  { id: 'D', label: 'D', x: 280, y: 150 },
  { id: 'E', label: 'E', x: 380, y: 150 },
]

const EDGES: GraphEdge[] = [
  { from: 'A', to: 'B' },
  { from: 'A', to: 'C' },
  { from: 'B', to: 'D' },
  { from: 'C', to: 'D' },
  { from: 'D', to: 'E' },
]

const WEIGHTED_EDGES: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'C', weight: 2 },
  { from: 'B', to: 'D', weight: 3 },
  { from: 'C', to: 'D', weight: 1 },
  { from: 'D', to: 'E', weight: 5 },
  { from: 'B', to: 'C', weight: 1 },
]

function g(nodes: GraphNode[], edges: GraphEdge[], extra: Partial<GraphState> = {}): GraphState {
  return { type: 'graph', nodes, edges, directed: false, ...extra }
}

export function generateBFS() {
  const adj: Record<string, string[]> = { A: ['B', 'C'], B: ['D'], C: ['D'], D: ['E'], E: [] }
  const visited: string[] = []
  const steps = [{ title: 'Start BFS', description: 'Begin from node A', state: g(NODES, EDGES, { current: 'A', visited: [], directed: false }) }]

  const queue = ['A']
  visited.push('A')
  steps.push({ title: 'Enqueue A', description: 'Visit A, enqueue neighbors', state: g(NODES, EDGES, { current: 'A', visited: [...visited], directed: false }) })

  const order: string[] = ['A']

  while (queue.length) {
    const node = queue.shift()!
    for (const neighbor of adj[node] ?? []) {
      if (!visited.includes(neighbor)) {
        visited.push(neighbor)
        order.push(neighbor)
        queue.push(neighbor)
        steps.push({
          title: `Visit ${neighbor}`,
          description: `Discovered from ${node}`,
          state: g(NODES, EDGES, { current: neighbor, visited: [...visited], path: order, directed: false }),
        })
      }
    }
  }
  return buildSteps(steps)
}

export function generateDFS() {
  const adj: Record<string, string[]> = { A: ['B', 'C'], B: ['D'], C: ['D'], D: ['E'], E: [] }
  const visited: string[] = []
  const order: string[] = []
  const steps = [{ title: 'Start DFS', description: 'Begin from node A', state: g(NODES, EDGES, { current: 'A', directed: false }) }]

  function dfs(node: string) {
    visited.push(node)
    order.push(node)
    steps.push({
      title: `Visit ${node}`,
      description: `DFS visiting ${node}`,
      state: g(NODES, EDGES, { current: node, visited: [...visited], path: order, directed: false }),
    })
    for (const neighbor of adj[node] ?? []) {
      if (!visited.includes(neighbor)) dfs(neighbor)
    }
  }
  dfs('A')
  return buildSteps(steps)
}

export function generateTopologicalSort() {
  const dagNodes: GraphNode[] = [
    { id: '5', label: '5', x: 60, y: 100 },
    { id: '11', label: '11', x: 60, y: 200 },
    { id: '2', label: '2', x: 180, y: 80 },
    { id: '9', label: '9', x: 180, y: 160 },
    { id: '10', label: '10', x: 180, y: 240 },
  ]
  const dagEdges: GraphEdge[] = [
    { from: '5', to: '11' }, { from: '5', to: '2' },
    { from: '11', to: '9' }, { from: '11', to: '10' },
    { from: '2', to: '9' },
  ]
  const order: string[] = []
  const steps = [{ title: 'DAG', description: 'Topological sort on directed acyclic graph', state: g(dagNodes, dagEdges, { directed: true }) }]

  for (const node of ['5', '11', '2', '9', '10']) {
    order.push(node)
    steps.push({
      title: `Output ${node}`,
      description: `All predecessors of ${node} already processed`,
      state: g(dagNodes, dagEdges, { visited: [...order], path: order, directed: true }),
    })
  }
  return buildSteps(steps)
}

export function generateDijkstra() {
  const dist: Record<string, number> = { A: 0, B: Infinity, C: Infinity, D: Infinity, E: Infinity }
  const visited: string[] = []
  const steps = [{ title: 'Init', description: 'dist[A]=0, others=∞', state: g(NODES, WEIGHTED_EDGES, { current: 'A', distances: { ...dist }, directed: true }) }]

  const updates: [string, number][] = [['A', 0], ['C', 2], ['D', 3], ['B', 6], ['E', 8]]
  for (const [node, d] of updates) {
    dist[node] = d
    visited.push(node)
    steps.push({
      title: `Process ${node}`,
      description: `Shortest distance to ${node} = ${d}`,
      state: g(NODES, WEIGHTED_EDGES, { current: node, visited: [...visited], distances: { ...dist }, directed: true }),
    })
  }
  return buildSteps(steps)
}

export function generatePrim() {
  const mst: string[] = []
  const steps = [{ title: 'Start Prim', description: 'Grow MST from node A', state: g(NODES, WEIGHTED_EDGES, { visited: ['A'], directed: false }) }]

  const edges = [['A', 'C'], ['C', 'D'], ['D', 'E'], ['A', 'B']]
  for (const [from, to] of edges) {
    mst.push(`${from}-${to}`)
    const visited = new Set(mst.flatMap((e) => e.split('-')))
    steps.push({
      title: `Add edge ${from}-${to}`,
      description: 'Minimum weight edge to unvisited node',
      state: g(NODES, WEIGHTED_EDGES.map((e) => ({
        ...e,
        highlight: mst.includes(`${e.from}-${e.to}`) || mst.includes(`${e.to}-${e.from}`),
      })), { visited: [...visited], mstEdges: mst, directed: false }),
    })
  }
  return buildSteps(steps)
}

export function generateKruskal() {
  const sorted = [...WEIGHTED_EDGES].sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))
  const mst: string[] = []
  const steps = [{ title: 'Sort Edges', description: 'Sort edges by weight ascending', state: g(NODES, WEIGHTED_EDGES, { directed: false }) }]

  for (const edge of sorted) {
    const key = `${edge.from}-${edge.to}`
    mst.push(key)
    steps.push({
      title: `Consider ${edge.from}-${edge.to} (${edge.weight})`,
      description: 'Add if no cycle formed',
      state: g(NODES, WEIGHTED_EDGES.map((e) => ({
        ...e,
        highlight: mst.includes(`${e.from}-${e.to}`) || mst.includes(`${e.to}-${e.from}`),
      })), { mstEdges: [...mst], directed: false }),
    })
    if (mst.length >= 4) break
  }
  return buildSteps(steps)
}
