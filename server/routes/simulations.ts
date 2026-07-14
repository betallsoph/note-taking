import { Router } from 'express'
import { mockStore } from '../mock-store.js'
import { generateBubbleSortSteps } from '../simulations/bubble-sort.js'
import { generateMergeSortSteps } from '../simulations/merge-sort.js'
import { generateBfsSteps } from '../simulations/bfs.js'
import { isDatabaseEnabled, searchEverything } from '../db/repositories.js'

const router = Router()

const generators: Record<string, (input: unknown) => { steps: unknown[]; title: string }> = {
  bubble_sort: (input) => {
    const arr = (input as { array?: number[] }).array ?? [5, 2, 4, 1, 3]
    return { steps: generateBubbleSortSteps(arr), title: 'Bubble Sort' }
  },
  merge_sort: (input) => {
    const arr = (input as { array?: number[] }).array ?? [5, 2, 4, 1, 3]
    return { steps: generateMergeSortSteps(arr), title: 'Merge Sort' }
  },
  bfs: (input) => {
    const data = input as { graph?: Record<string, string[]>; start?: string }
    const graph = data.graph ?? { A: ['B', 'C'], B: ['D'], C: ['E'], D: [], E: [] }
    const start = data.start ?? 'A'
    return { steps: generateBfsSteps(graph, start), title: 'Breadth-First Search' }
  },
}

router.get('/types', (_req, res) => {
  res.json({
    dataStructures: [
      'array', 'linked_list', 'stack', 'queue', 'hash_table',
      'heap', 'binary_search_tree', 'avl_tree', 'trie', 'graph',
    ],
    sorting: ['bubble_sort', 'selection_sort', 'insertion_sort', 'merge_sort', 'quick_sort'],
    graph: ['bfs', 'dfs', 'dijkstra', 'kruskal', 'prim'],
    tree: ['bst_insert', 'bst_delete', 'tree_traversal'],
  })
})

router.post('/generate', (req, res) => {
  const { type, input } = req.body
  const generator = generators[type]
  if (!generator) {
    return res.status(400).json({
      error: 'Simulation type not yet implemented',
      available: Object.keys(generators),
    })
  }
  const result = generator(input)
  res.json({ type, ...result })
})

router.get('/search', async (req, res) => {
  const q = ((req.query.q as string) ?? '').toLowerCase()
  if (isDatabaseEnabled()) {
    return res.json(await searchEverything(req.user.id, q))
  }

  const articles = mockStore.articles.filter(
    (a) =>
      a.userId === req.user.id &&
      !a.isArchived &&
      (a.title.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q)),
  )
  const problems = mockStore.problems.filter(
    (p) => p.userId === req.user.id && p.title.toLowerCase().includes(q),
  )
  const flashcards = mockStore.flashcards.filter(
    (f) =>
      f.userId === req.user.id &&
      (f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)),
  )
  const notes = mockStore.notes.filter((n) => {
    if (n.userId !== req.user.id) return false
    const markdown =
      typeof n.content.markdown === 'string' ? n.content.markdown.toLowerCase() : ''
    return n.title.toLowerCase().includes(q) || markdown.includes(q)
  })
  res.json({ articles, problems, flashcards, notes })
})

export default router
