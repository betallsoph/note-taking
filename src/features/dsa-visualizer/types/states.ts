export interface ArrayState {
  type: 'array'
  values: (number | string)[]
  highlights?: number[]
  pointers?: { label: string; index: number }[]
  sorted?: number[]
  swapped?: [number, number]
}

export interface LinkedListNode {
  id: string
  value: number
  prev?: string | null
  next?: string | null
}

export interface LinkedListState {
  type: 'linked-list'
  nodes: LinkedListNode[]
  headId: string | null
  variant: 'singly' | 'doubly'
  highlights?: string[]
}

export interface StackState {
  type: 'stack'
  items: number[]
  highlightIndex?: number
}

export interface QueueState {
  type: 'queue'
  items: number[]
  highlightIndex?: number
  operation?: 'enqueue' | 'dequeue'
}

export interface HashBucket {
  key: string
  value: number
}

export interface HashTableState {
  type: 'hash-table'
  buckets: (HashBucket | null)[][]
  bucketCount: number
  highlightKey?: string
  collisionKeys?: string[]
}

export interface TreeNode {
  id: string
  value: number
  left?: string | null
  right?: string | null
  parent?: string | null
  x?: number
  y?: number
  balance?: number
}

export interface TreeState {
  type: 'tree'
  nodes: TreeNode[]
  rootId: string | null
  highlights?: string[]
  rotation?: 'LL' | 'RR' | 'LR' | 'RL' | null
  variant?: 'bst' | 'avl'
}

export interface HeapState {
  type: 'heap'
  values: number[]
  highlights?: number[]
  variant: 'min' | 'max'
}

export interface TrieNode {
  id: string
  char: string
  isEnd: boolean
  children: Record<string, string>
  x?: number
  y?: number
}

export interface TrieState {
  type: 'trie'
  nodes: TrieNode[]
  rootId: string
  highlights?: string[]
  prefix?: string
}

export interface GraphNode {
  id: string
  label: string
  x: number
  y: number
}

export interface GraphEdge {
  from: string
  to: string
  weight?: number
  highlight?: boolean
}

export interface GraphState {
  type: 'graph'
  nodes: GraphNode[]
  edges: GraphEdge[]
  visited?: string[]
  current?: string
  path?: string[]
  directed: boolean
  distances?: Record<string, number>
  mstEdges?: string[]
}

export interface UnionFindState {
  type: 'union-find'
  parent: number[]
  rank: number[]
  highlights?: number[]
  compressed?: number[]
}

export interface RecursionNode {
  id: string
  label: string
  children: string[]
  status: 'active' | 'returning' | 'base' | 'pending'
  result?: number | string
}

export interface RecursionTreeState {
  type: 'recursion-tree'
  nodes: RecursionNode[]
  rootId: string
  callStack?: string[]
}

export interface DecisionNode {
  id: string
  label: string
  children: string[]
  status: 'exploring' | 'accepted' | 'rejected' | 'pending'
  depth: number
}

export interface DecisionTreeState {
  type: 'decision-tree'
  nodes: DecisionNode[]
  rootId: string
  solution?: string[]
}

export interface DpTableState {
  type: 'dp-table'
  table: (number | string | null)[][]
  rowLabels?: string[]
  colLabels?: string[]
  highlightCell?: [number, number]
  filledCells?: [number, number][]
}

export interface StringMatchState {
  type: 'string-match'
  text: string
  pattern: string
  textIndex: number
  patternIndex: number
  highlights?: { start: number; end: number; target: 'text' | 'pattern' }[]
  lps?: number[]
  hash?: number
  matches?: number[]
}

export type VisualizationState =
  | ArrayState
  | LinkedListState
  | StackState
  | QueueState
  | HashTableState
  | TreeState
  | HeapState
  | TrieState
  | GraphState
  | UnionFindState
  | RecursionTreeState
  | DecisionTreeState
  | DpTableState
  | StringMatchState
