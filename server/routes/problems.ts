import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'
import type { Difficulty } from '../mock-store.js'
import {
  addMistake,
  addSolution,
  createProblem,
  deleteProblem,
  getProblem,
  isDatabaseEnabled,
  listProblems,
  updateProblem,
} from '../db/repositories.js'
import { queryParam } from './params.js'

const router = Router()

router.get('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    const items = await listProblems(req.user.id, {
      difficulty: queryParam(req.query.difficulty),
      tag: queryParam(req.query.tag),
      search: queryParam(req.query.search),
    })
    return res.json(items)
  }

  let items = mockStore.problems.filter((p) => p.userId === req.user.id)
  const { difficulty, tag, search } = req.query
  if (difficulty) items = items.filter((p) => p.difficulty === difficulty)
  if (tag) items = items.filter((p) => p.tagIds.includes(tag as string))
  if (search) {
    const q = (search as string).toLowerCase()
    items = items.filter((p) => p.title.toLowerCase().includes(q))
  }
  res.json(items)
})

router.get('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const problem = await getProblem(req.user.id, req.params.id)
    if (!problem) return res.status(404).json({ error: 'Not found' })
    return res.json(problem)
  }

  const problem = mockStore.problems.find((p) => p.id === req.params.id && p.userId === req.user.id)
  if (!problem) return res.status(404).json({ error: 'Not found' })
  const solutions = mockStore.solutions.filter((s) => s.problemId === problem.id)
  const mistakes = mockStore.mistakes.filter((m) => m.problemId === problem.id)
  res.json({ ...problem, solutions, mistakes })
})

router.post('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    const problem = await createProblem(req.user.id, req.body)
    return res.status(201).json(problem)
  }

  const { title, difficulty, description, constraints, examples, source, tagIds } = req.body
  const problem = {
    id: id(),
    userId: req.user.id,
    title,
    slug: slugify(title),
    difficulty: (difficulty ?? 'medium') as Difficulty,
    description,
    constraints: constraints ?? null,
    examples: examples ?? [],
    source: source ?? null,
    learningNotes: null,
    isSolved: false,
    tagIds: tagIds ?? [],
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.problems.push(problem)
  res.status(201).json(problem)
})

router.put('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const problem = await updateProblem(req.user.id, req.params.id, req.body)
    if (!problem) return res.status(404).json({ error: 'Not found' })
    return res.json(problem)
  }

  const idx = mockStore.problems.findIndex((p) => p.id === req.params.id && p.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.problems[idx] = { ...mockStore.problems[idx], ...req.body, updatedAt: now() }
  res.json(mockStore.problems[idx])
})

router.delete('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deleteProblem(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.problems.findIndex((p) => p.id === req.params.id && p.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.problems.splice(idx, 1)
  mockStore.solutions = mockStore.solutions.filter((s) => s.problemId !== req.params.id)
  mockStore.mistakes = mockStore.mistakes.filter((m) => m.problemId !== req.params.id)
  res.status(204).send()
})

router.post('/:id/solutions', async (req, res) => {
  if (isDatabaseEnabled()) {
    const solution = await addSolution(req.user.id, req.params.id, req.body)
    if (!solution) return res.status(404).json({ error: 'Not found' })
    return res.status(201).json(solution)
  }

  const problem = mockStore.problems.find((p) => p.id === req.params.id && p.userId === req.user.id)
  if (!problem) return res.status(404).json({ error: 'Not found' })
  const solution = {
    id: id(),
    problemId: problem.id,
    title: req.body.title,
    explanation: req.body.explanation ?? null,
    code: req.body.code,
    language: req.body.language ?? 'typescript',
    timeComplexity: req.body.timeComplexity ?? null,
    spaceComplexity: req.body.spaceComplexity ?? null,
    notes: req.body.notes ?? null,
    isOptimal: req.body.isOptimal ?? false,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.solutions.push(solution)
  res.status(201).json(solution)
})

router.post('/:id/mistakes', async (req, res) => {
  if (isDatabaseEnabled()) {
    const mistake = await addMistake(req.user.id, req.params.id, req.body)
    if (!mistake) return res.status(404).json({ error: 'Not found' })
    return res.status(201).json(mistake)
  }

  const problem = mockStore.problems.find((p) => p.id === req.params.id && p.userId === req.user.id)
  if (!problem) return res.status(404).json({ error: 'Not found' })
  const mistake = {
    id: id(),
    problemId: problem.id,
    type: req.body.type,
    description: req.body.description,
    lessonLearned: req.body.lessonLearned ?? null,
    createdAt: now(),
  }
  mockStore.mistakes.push(mistake)
  res.status(201).json(mistake)
})

export default router
