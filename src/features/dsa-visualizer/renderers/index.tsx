import type { RendererType } from '../types'
import { ArrayRenderer } from './ArrayRenderer'
import { LinkedListRenderer } from './LinkedListRenderer'
import { StackRenderer } from './StackRenderer'
import { QueueRenderer } from './QueueRenderer'
import { HashTableRenderer } from './HashTableRenderer'
import { TreeRenderer } from './TreeRenderer'
import { HeapRenderer } from './HeapRenderer'
import { TrieRenderer } from './TrieRenderer'
import { GraphRenderer } from './GraphRenderer'
import { UnionFindRenderer } from './UnionFindRenderer'
import { RecursionTreeRenderer } from './RecursionTreeRenderer'
import { DecisionTreeRenderer } from './DecisionTreeRenderer'
import { DpTableRenderer } from './DpTableRenderer'
import { StringMatchRenderer } from './StringMatchRenderer'

interface VisualizationRendererProps {
  state: unknown
  rendererType: RendererType
}

export function VisualizationRenderer({ state, rendererType }: VisualizationRendererProps) {
  if (!state || typeof state !== 'object' || !('type' in state)) {
    return (
      <div className="flex min-h-[280px] items-center justify-center text-muted-foreground">
        No visualization state
      </div>
    )
  }

  const typed = state as { type: string }

  switch (rendererType) {
    case 'array':
      if (typed.type === 'array') return <ArrayRenderer state={state as import('../types/states').ArrayState} />
      break
    case 'linked-list':
      if (typed.type === 'linked-list') return <LinkedListRenderer state={state as import('../types/states').LinkedListState} />
      break
    case 'stack':
      if (typed.type === 'stack') return <StackRenderer state={state as import('../types/states').StackState} />
      break
    case 'queue':
      if (typed.type === 'queue') return <QueueRenderer state={state as import('../types/states').QueueState} />
      break
    case 'hash-table':
      if (typed.type === 'hash-table') return <HashTableRenderer state={state as import('../types/states').HashTableState} />
      break
    case 'tree':
      if (typed.type === 'tree') return <TreeRenderer state={state as import('../types/states').TreeState} />
      break
    case 'heap':
      if (typed.type === 'heap') return <HeapRenderer state={state as import('../types/states').HeapState} />
      break
    case 'trie':
      if (typed.type === 'trie') return <TrieRenderer state={state as import('../types/states').TrieState} />
      break
    case 'graph':
      if (typed.type === 'graph') return <GraphRenderer state={state as import('../types/states').GraphState} />
      break
    case 'union-find':
      if (typed.type === 'union-find') return <UnionFindRenderer state={state as import('../types/states').UnionFindState} />
      break
    case 'recursion-tree':
      if (typed.type === 'recursion-tree') return <RecursionTreeRenderer state={state as import('../types/states').RecursionTreeState} />
      break
    case 'decision-tree':
      if (typed.type === 'decision-tree') return <DecisionTreeRenderer state={state as import('../types/states').DecisionTreeState} />
      break
    case 'dp-table':
      if (typed.type === 'dp-table') return <DpTableRenderer state={state as import('../types/states').DpTableState} />
      break
    case 'string-match':
      if (typed.type === 'string-match') return <StringMatchRenderer state={state as import('../types/states').StringMatchState} />
      break
  }

  return (
    <div className="flex min-h-[280px] items-center justify-center text-muted-foreground">
      Unable to render visualization
    </div>
  )
}
