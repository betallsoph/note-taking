export interface VisualizationStep {
  id: string
  title: string
  description: string
  state: unknown
}

export type VisualizationCategory = 'data-structure' | 'algorithm'

export type RendererType =
  | 'array'
  | 'linked-list'
  | 'stack'
  | 'queue'
  | 'hash-table'
  | 'tree'
  | 'heap'
  | 'trie'
  | 'graph'
  | 'union-find'
  | 'recursion-tree'
  | 'decision-tree'
  | 'dp-table'
  | 'string-match'

export interface VisualizerConfig {
  id: string
  title: string
  category: VisualizationCategory
  subcategory: string
  description: string
  rendererType: RendererType
  generate: () => VisualizationStep[]
}

export type SpeedMultiplier = 0.5 | 1 | 2 | 4

export const SPEED_OPTIONS: { value: SpeedMultiplier; label: string }[] = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
]

export const BASE_INTERVAL_MS = 1000
