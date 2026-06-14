import { buildSteps } from '../types/utils'
import type { TreeNode, TreeState } from '../types/states'

function treeState(
  nodes: TreeNode[],
  rootId: string | null,
  highlights?: string[],
): TreeState {
  return { type: 'tree', nodes, rootId, highlights, variant: 'bst' }
}

function makeBST(values: number[]): { nodes: TreeNode[]; rootId: string | null } {
  const nodes: TreeNode[] = []
  let rootId: string | null = null

  for (const val of values) {
    const id = `n${val}`
    const node: TreeNode = { id, value: val, left: null, right: null }
    nodes.push(node)

    if (!rootId) {
      rootId = id
      continue
    }

    let current = rootId
    while (current) {
      const curr = nodes.find((n) => n.id === current)!
      if (val < curr.value) {
        if (!curr.left) {
          curr.left = id
          break
        }
        current = curr.left
      } else {
        if (!curr.right) {
          curr.right = id
          break
        }
        current = curr.right
      }
    }
  }
  return { nodes, rootId }
}

export function generateBSTInsert() {
  const values = [50, 30, 70, 20, 40]
  const steps = [{ title: 'Empty BST', description: 'Starting with empty tree', state: treeState([], null) }]
  for (let i = 0; i < values.length; i++) {
    const partial = makeBST(values.slice(0, i + 1))
    steps.push({
      title: `Insert ${values[i]}`,
      description: `Inserting ${values[i]} into BST`,
      state: treeState(partial.nodes, partial.rootId, [`n${values[i]}`]),
    })
  }
  return buildSteps(steps)
}

export function generateBSTSearch() {
  const { nodes, rootId } = makeBST([50, 30, 70, 20, 40, 60, 80])
  const target = 40
  const path = ['n50', 'n30', 'n40']
  const steps = [{ title: 'Start Search', description: `Searching for ${target}`, state: treeState(nodes, rootId) }]
  for (const id of path) {
    const node = nodes.find((n) => n.id === id)!
    steps.push({
      title: `Visit ${node.value}`,
      description: node.value === target ? `Found ${target}` : `${target} ${target < node.value ? '<' : '>'} ${node.value}`,
      state: treeState(nodes, rootId, [id]),
    })
  }
  return buildSteps(steps)
}

export function generateBSTDelete() {
  const before = makeBST([50, 30, 70, 20, 40])
  const after = makeBST([50, 30, 70, 20])
  return buildSteps([
    { title: 'BST State', description: 'Tree before deletion', state: treeState(before.nodes, before.rootId) },
    { title: 'Find Node 40', description: 'Locate node to delete (no children)', state: treeState(before.nodes, before.rootId, ['n40']) },
    { title: 'Remove Leaf', description: 'Remove leaf node 40', state: treeState(after.nodes, after.rootId) },
  ])
}
