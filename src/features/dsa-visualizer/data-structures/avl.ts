import { buildSteps } from '../types/utils'
import type { TreeNode, TreeState } from '../types/states'

function avlState(
  nodes: TreeNode[],
  rootId: string | null,
  highlights?: string[],
  rotation?: TreeState['rotation'],
): TreeState {
  return { type: 'tree', nodes, rootId, highlights, rotation, variant: 'avl' }
}

function avlTree(nodes: TreeNode[], rootId: string, highlights?: string[], rotation?: TreeState['rotation']): TreeState {
  return avlState(nodes, rootId, highlights, rotation)
}

export function generateAVLInsert() {
  const steps = [
    { title: 'Insert 30', description: 'Single node, balanced', state: avlTree([{ id: 'n30', value: 30, left: null, right: null, balance: 0 }], 'n30') },
    { title: 'Insert 20', description: 'Left child added', state: avlTree([
      { id: 'n30', value: 30, left: 'n20', right: null, balance: 1 },
      { id: 'n20', value: 20, left: null, right: null, balance: 0 },
    ], 'n30') },
    { title: 'Insert 10 - LL Case', description: 'Unbalanced: LL rotation needed', state: avlTree([
      { id: 'n30', value: 30, left: 'n20', right: null, balance: 2 },
      { id: 'n20', value: 20, left: 'n10', right: null, balance: 1 },
      { id: 'n10', value: 10, left: null, right: null, balance: 0 },
    ], 'n30', ['n10', 'n20', 'n30']) },
    { title: 'LL Rotation', description: 'Rotate right: 10 becomes root', state: avlTree([
      { id: 'n20', value: 20, left: 'n10', right: 'n30', balance: 0 },
      { id: 'n10', value: 10, left: null, right: null, balance: 0 },
      { id: 'n30', value: 30, left: null, right: null, balance: 0 },
    ], 'n20', ['n20'], 'LL') },
  ]
  return buildSteps(steps)
}

export function generateAVLInsertRR() {
  return buildSteps([
    { title: 'Insert 10, 20, 30', description: 'Right-heavy tree', state: avlTree([
      { id: 'n10', value: 10, left: null, right: 'n20', balance: -2 },
      { id: 'n20', value: 20, left: null, right: 'n30', balance: -1 },
      { id: 'n30', value: 30, left: null, right: null, balance: 0 },
    ], 'n10', ['n10', 'n20', 'n30']) },
    { title: 'RR Rotation', description: 'Rotate left: 20 becomes root', state: avlTree([
      { id: 'n20', value: 20, left: 'n10', right: 'n30', balance: 0 },
      { id: 'n10', value: 10, left: null, right: null, balance: 0 },
      { id: 'n30', value: 30, left: null, right: null, balance: 0 },
    ], 'n20', ['n20'], 'RR') },
  ])
}

export function generateAVLInsertLR() {
  return buildSteps([
    { title: 'LR Case', description: 'Left child has right subtree', state: avlTree([
      { id: 'n30', value: 30, left: 'n10', right: null, balance: 2 },
      { id: 'n10', value: 10, left: null, right: 'n20', balance: -1 },
      { id: 'n20', value: 20, left: null, right: null, balance: 0 },
    ], 'n30', ['n10', 'n20', 'n30']) },
    { title: 'LR Rotation', description: 'Left rotate child, then right rotate root', state: avlTree([
      { id: 'n20', value: 20, left: 'n10', right: 'n30', balance: 0 },
      { id: 'n10', value: 10, left: null, right: null, balance: 0 },
      { id: 'n30', value: 30, left: null, right: null, balance: 0 },
    ], 'n20', ['n20'], 'LR') },
  ])
}

export function generateAVLInsertRL() {
  return buildSteps([
    { title: 'RL Case', description: 'Right child has left subtree', state: avlTree([
      { id: 'n10', value: 10, left: null, right: 'n30', balance: -2 },
      { id: 'n30', value: 30, left: 'n20', right: null, balance: 1 },
      { id: 'n20', value: 20, left: null, right: null, balance: 0 },
    ], 'n10', ['n10', 'n20', 'n30']) },
    { title: 'RL Rotation', description: 'Right rotate child, then left rotate root', state: avlTree([
      { id: 'n20', value: 20, left: 'n10', right: 'n30', balance: 0 },
      { id: 'n10', value: 10, left: null, right: null, balance: 0 },
      { id: 'n30', value: 30, left: null, right: null, balance: 0 },
    ], 'n20', ['n20'], 'RL') },
  ])
}

export function generateAVLDelete() {
  return buildSteps([
    { title: 'AVL Tree', description: 'Balanced tree before delete', state: avlTree([
      { id: 'n20', value: 20, left: 'n10', right: 'n30', balance: 0 },
      { id: 'n10', value: 10, left: null, right: null, balance: 0 },
      { id: 'n30', value: 30, left: null, right: null, balance: 0 },
    ], 'n20') },
    { title: 'Delete 10', description: 'Remove leaf node 10', state: avlTree([
      { id: 'n20', value: 20, left: null, right: 'n30', balance: -1 },
      { id: 'n30', value: 30, left: null, right: null, balance: 0 },
    ], 'n20', ['n10']) },
    { title: 'Rebalance', description: 'Tree remains balanced (RR rotation if needed)', state: avlTree([
      { id: 'n30', value: 30, left: 'n20', right: null, balance: 0 },
      { id: 'n20', value: 20, left: null, right: null, balance: 0 },
    ], 'n30', ['n30'], 'RR') },
  ])
}
