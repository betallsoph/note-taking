import { buildSteps } from '../types/utils'
import type { LinkedListNode, LinkedListState } from '../types/states'

function listState(
  nodes: LinkedListNode[],
  headId: string | null,
  variant: 'singly' | 'doubly',
  highlights?: string[],
): LinkedListState {
  return { type: 'linked-list', nodes, headId, variant, highlights }
}

function buildSingly(values: number[]) {
  const nodes: LinkedListNode[] = values.map((v, i) => ({
    id: `n${i}`,
    value: v,
    next: i < values.length - 1 ? `n${i + 1}` : null,
  }))
  return { nodes, headId: values.length ? 'n0' : null }
}

function buildDoubly(values: number[]) {
  const nodes: LinkedListNode[] = values.map((v, i) => ({
    id: `n${i}`,
    value: v,
    prev: i > 0 ? `n${i - 1}` : null,
    next: i < values.length - 1 ? `n${i + 1}` : null,
  }))
  return { nodes, headId: values.length ? 'n0' : null }
}

export function generateLinkedListInsertHead(variant: 'singly' | 'doubly') {
  const initial = variant === 'singly' ? buildSingly([20, 30, 40]) : buildDoubly([20, 30, 40])
  const newNode: LinkedListNode = { id: 'new', value: 10, next: initial.headId, prev: null }
  if (variant === 'doubly' && initial.nodes[0]) {
    initial.nodes[0].prev = 'new'
    newNode.next = 'n0'
  }
  return buildSteps([
    { title: 'Initial List', description: 'Current linked list', state: listState(initial.nodes, initial.headId, variant) },
    { title: 'Create Node', description: 'Create new node with value 10', state: listState([newNode, ...initial.nodes], initial.headId, variant, ['new']) },
    { title: 'Insert at Head', description: 'Point new node to current head', state: listState([newNode, ...initial.nodes], 'new', variant, ['new']) },
  ])
}

export function generateLinkedListInsertTail(variant: 'singly' | 'doubly') {
  const initial = variant === 'singly' ? buildSingly([10, 20, 30]) : buildDoubly([10, 20, 30])
  const newNode: LinkedListNode = { id: 'new', value: 40, next: null, prev: 'n2' }
  const updated = initial.nodes.map((n) =>
    n.id === 'n2' ? { ...n, next: 'new' } : n,
  )
  return buildSteps([
    { title: 'Initial List', description: 'Traverse to tail', state: listState(initial.nodes, initial.headId, variant) },
    { title: 'At Tail', description: 'Reached last node (30)', state: listState(initial.nodes, initial.headId, variant, ['n2']) },
    { title: 'Insert at Tail', description: 'Append node with value 40', state: listState([...updated, newNode], initial.headId, variant, ['new']) },
  ])
}

export function generateLinkedListDelete(variant: 'singly' | 'doubly') {
  const initial = variant === 'singly' ? buildSingly([10, 20, 30, 40]) : buildDoubly([10, 20, 30, 40])
  const after = initial.nodes
    .filter((n) => n.id !== 'n2')
    .map((n) => {
      if (n.id === 'n1') return { ...n, next: 'n3' }
      if (n.id === 'n3' && variant === 'doubly') return { ...n, prev: 'n1' }
      return n
    })
  return buildSteps([
    { title: 'Initial List', description: 'List before deletion', state: listState(initial.nodes, initial.headId, variant) },
    { title: 'Find Node', description: 'Locate node with value 30', state: listState(initial.nodes, initial.headId, variant, ['n2']) },
    { title: 'Bypass Node', description: 'Update pointers to skip node', state: listState(after, initial.headId, variant, ['n1', 'n3']) },
    { title: 'Deleted', description: 'Node 30 removed from list', state: listState(after, initial.headId, variant) },
  ])
}

export function generateLinkedListSearch(variant: 'singly' | 'doubly') {
  const initial = variant === 'singly' ? buildSingly([10, 20, 30, 40]) : buildDoubly([10, 20, 30, 40])
  const target = 30
  const steps = [{ title: 'Start Search', description: `Searching for ${target}`, state: listState(initial.nodes, initial.headId, variant) }]
  for (const node of initial.nodes) {
    steps.push({
      title: `Check ${node.value}`,
      description: node.value === target ? `Found ${target}` : `${node.value} ≠ ${target}, continue`,
      state: listState(initial.nodes, initial.headId, variant, [node.id]),
    })
    if (node.value === target) break
  }
  return buildSteps(steps)
}
