import { buildSteps } from '../types/utils'
import type { TrieNode, TrieState } from '../types/states'

function trieState(
  nodes: TrieNode[],
  rootId: string,
  highlights?: string[],
  prefix?: string,
): TrieState {
  return { type: 'trie', nodes, rootId, highlights, prefix }
}

function buildTrie(words: string[]): { nodes: TrieNode[]; rootId: string } {
  const root: TrieNode = { id: 'root', char: '', isEnd: false, children: {} }
  const nodes = [root]

  for (const word of words) {
    let current = root
    for (const char of word) {
      if (!current.children[char]) {
        const id = `${current.id}-${char}`
        const node: TrieNode = { id, char, isEnd: false, children: {} }
        current.children[char] = id
        nodes.push(node)
        current = node
      } else {
        current = nodes.find((n) => n.id === current.children[char])!
      }
    }
    current.isEnd = true
  }
  return { nodes, rootId: 'root' }
}

export function generateTrieInsert() {
  const words = ['cat', 'car', 'dog']
  const steps = [{ title: 'Empty Trie', description: 'Root node only', state: trieState([{ id: 'root', char: '', isEnd: false, children: {} }], 'root') }]
  for (let i = 0; i < words.length; i++) {
    const partial = buildTrie(words.slice(0, i + 1))
    steps.push({
      title: `Insert "${words[i]}"`,
      description: `Add characters of "${words[i]}"`,
      state: trieState(partial.nodes, partial.rootId, [partial.nodes[partial.nodes.length - 1]?.id]),
    })
  }
  return buildSteps(steps)
}

export function generateTrieSearch() {
  const { nodes, rootId } = buildTrie(['cat', 'car', 'dog'])
  const target = 'car'
  const path = ['root', 'root-c', 'root-c-a', 'root-c-a-r']
  const steps = [{ title: 'Search', description: `Searching for "${target}"`, state: trieState(nodes, rootId) }]
  for (const id of path) {
    steps.push({
      title: `Visit "${nodes.find((n) => n.id === id)?.char || 'root'}"`,
      description: `Follow edge in trie`,
      state: trieState(nodes, rootId, [id]),
    })
  }
  steps.push({
    title: 'Found',
    description: `"${target}" exists (isEnd = true)`,
    state: trieState(nodes, rootId, [path[path.length - 1]]),
  })
  return buildSteps(steps)
}

export function generateTriePrefixSearch() {
  const { nodes, rootId } = buildTrie(['cat', 'car', 'card', 'dog'])
  const prefix = 'ca'
  const path = ['root', 'root-c', 'root-c-a']
  const steps = [{ title: 'Prefix Search', description: `Find all words with prefix "${prefix}"`, state: trieState(nodes, rootId, undefined, prefix) }]
  for (const id of path) {
    steps.push({
      title: `Match "${nodes.find((n) => n.id === id)?.char || 'root'}"`,
      description: `Prefix character matched`,
      state: trieState(nodes, rootId, [id], prefix),
    })
  }
  steps.push({
    title: 'Collect Words',
    description: 'DFS from prefix node: car, card, cat',
    state: trieState(nodes, rootId, path, prefix),
  })
  return buildSteps(steps)
}
