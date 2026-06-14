import { buildSteps } from '../types/utils'
import type { DecisionTreeState, DecisionNode } from '../types/states'

function decState(nodes: DecisionNode[], rootId: string, solution?: string[]): DecisionTreeState {
  return { type: 'decision-tree', nodes, rootId, solution }
}

export function generatePermutations() {
  const nodes: DecisionNode[] = [
    { id: 'root', label: 'permute [1,2,3]', children: ['c1', 'c2', 'c3'], status: 'exploring', depth: 0 },
    { id: 'c1', label: 'pick 1 → [1]', children: ['c1a'], status: 'exploring', depth: 1 },
    { id: 'c2', label: 'pick 2 → [2]', children: [], status: 'rejected', depth: 1 },
    { id: 'c3', label: 'pick 3 → [3]', children: [], status: 'pending', depth: 1 },
    { id: 'c1a', label: 'pick 2 → [1,2]', children: ['c1b'], status: 'exploring', depth: 2 },
    { id: 'c1b', label: 'pick 3 → [1,2,3]', children: [], status: 'accepted', depth: 3 },
  ]
  return buildSteps([
    { title: 'Start', description: 'Generate all permutations of [1,2,3]', state: decState(nodes, 'root') },
    { title: 'Choose 1', description: 'Include 1, recurse on remaining', state: decState(nodes.map((n) => n.id === 'c1' ? { ...n, status: 'exploring' as const } : n), 'root') },
    { title: 'Choose 2', description: 'Include 2, recurse', state: decState(nodes.map((n) => n.id === 'c1a' ? { ...n, status: 'exploring' as const } : n), 'root') },
    { title: 'Complete', description: 'Found permutation [1,2,3]', state: decState(nodes, 'root', ['1', '2', '3']) },
  ])
}

export function generateSubsets() {
  const nodes: DecisionNode[] = [
    { id: 'root', label: 'subsets [1,2,3]', children: ['inc1', 'exc1'], status: 'exploring', depth: 0 },
    { id: 'inc1', label: 'include 1 → {1}', children: ['inc2', 'exc2'], status: 'exploring', depth: 1 },
    { id: 'exc1', label: 'exclude 1 → {}', children: [], status: 'exploring', depth: 1 },
    { id: 'inc2', label: 'include 2 → {1,2}', children: [], status: 'accepted', depth: 2 },
    { id: 'exc2', label: 'exclude 2 → {1}', children: [], status: 'accepted', depth: 2 },
  ]
  return buildSteps([
    { title: 'Start', description: 'Generate all subsets', state: decState(nodes, 'root') },
    { title: 'Include/Exclude 1', description: 'Branch: include or exclude element 1', state: decState(nodes, 'root') },
    { title: 'Include/Exclude 2', description: 'Branch at element 2', state: decState(nodes.map((n) => n.id === 'inc1' ? { ...n, status: 'exploring' as const } : n), 'root') },
    { title: 'Leaf Subsets', description: 'Collected {1,2} and {1}', state: decState(nodes, 'root', ['1', '2']) },
  ])
}

export function generateNQueens() {
  const nodes: DecisionNode[] = [
    { id: 'root', label: 'place row 0', children: ['c0', 'c1', 'c2', 'c3'], status: 'exploring', depth: 0 },
    { id: 'c0', label: 'col 0', children: ['r1c2'], status: 'rejected', depth: 1 },
    { id: 'c1', label: 'col 1', children: ['r1c3'], status: 'exploring', depth: 1 },
    { id: 'c2', label: 'col 2', children: [], status: 'pending', depth: 1 },
    { id: 'c3', label: 'col 3', children: [], status: 'pending', depth: 1 },
    { id: 'r1c3', label: 'row 1, col 3', children: ['sol'], status: 'exploring', depth: 2 },
    { id: 'sol', label: 'valid placement', children: [], status: 'accepted', depth: 4 },
  ]
  return buildSteps([
    { title: 'Row 0', description: 'Try placing queen in each column', state: decState(nodes, 'root') },
    { title: 'Conflict', description: 'col 0 attacked by diagonal, backtrack', state: decState(nodes.map((n) => n.id === 'c0' ? { ...n, status: 'rejected' as const } : n), 'root') },
    { title: 'Try col 1', description: 'Place queen at (0,1)', state: decState(nodes.map((n) => n.id === 'c1' ? { ...n, status: 'exploring' as const } : n), 'root') },
    { title: 'Solution', description: 'Found valid 4-queens placement', state: decState(nodes, 'root', ['(0,1)', '(1,3)', '(2,0)', '(3,2)']) },
  ])
}
