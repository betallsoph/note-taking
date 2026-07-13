import { Router } from 'express'
import { mockStore, id, now } from '../mock-store.js'
import type { Difficulty, ReviewRating } from '../mock-store.js'
import {
  createFlashcard,
  deleteFlashcard,
  getFlashcard,
  isDatabaseEnabled,
  listDueFlashcards,
  listFlashcards,
  reviewFlashcard,
  updateFlashcard,
} from '../db/repositories.js'
import { queryParam } from './params.js'

const REVIEW_INTERVALS = [1, 3, 7, 14, 30]

const router = Router()

router.get('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    const items = await listFlashcards(req.user.id, {
      category: queryParam(req.query.category),
      search: queryParam(req.query.search),
    })
    return res.json(items)
  }

  let items = mockStore.flashcards.filter((f) => f.userId === req.user.id)
  const { category, search } = req.query
  if (category) items = items.filter((f) => f.category === category)
  if (search) {
    const q = (search as string).toLowerCase()
    items = items.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q),
    )
  }
  res.json(items)
})

router.get('/due', async (req, res) => {
  if (isDatabaseEnabled()) {
    return res.json(await listDueFlashcards(req.user.id))
  }

  const due = mockStore.flashcards.filter(
    (f) =>
      f.userId === req.user.id &&
      f.nextReviewAt &&
      new Date(f.nextReviewAt) <= new Date(),
  )
  res.json(due)
})

router.get('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const card = await getFlashcard(req.user.id, req.params.id)
    if (!card) return res.status(404).json({ error: 'Not found' })
    return res.json(card)
  }

  const card = mockStore.flashcards.find((f) => f.id === req.params.id && f.userId === req.user.id)
  if (!card) return res.status(404).json({ error: 'Not found' })
  res.json(card)
})

router.post('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    const card = await createFlashcard(req.user.id, req.body)
    return res.status(201).json(card)
  }

  const { category, question, answer, difficulty, personalNotes } = req.body
  const card = {
    id: id(),
    userId: req.user.id,
    category,
    question,
    answer,
    difficulty: (difficulty ?? 'medium') as Difficulty,
    personalNotes: personalNotes ?? null,
    nextReviewAt: new Date().toISOString(),
    reviewIntervalDays: 1,
    reviewCount: 0,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.flashcards.push(card)
  res.status(201).json(card)
})

router.put('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const card = await updateFlashcard(req.user.id, req.params.id, req.body)
    if (!card) return res.status(404).json({ error: 'Not found' })
    return res.json(card)
  }

  const idx = mockStore.flashcards.findIndex((f) => f.id === req.params.id && f.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.flashcards[idx] = { ...mockStore.flashcards[idx], ...req.body, updatedAt: now() }
  res.json(mockStore.flashcards[idx])
})

router.delete('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deleteFlashcard(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.flashcards.findIndex((f) => f.id === req.params.id && f.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.flashcards.splice(idx, 1)
  res.status(204).send()
})

router.post('/:id/review', async (req, res) => {
  if (isDatabaseEnabled()) {
    const card = await reviewFlashcard(req.user.id, req.params.id, req.body.rating as ReviewRating)
    if (!card) return res.status(404).json({ error: 'Not found' })
    return res.json(card)
  }

  const idx = mockStore.flashcards.findIndex((f) => f.id === req.params.id && f.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  const card = mockStore.flashcards[idx]
  const rating = req.body.rating as 'again' | 'hard' | 'good' | 'easy'

  let intervalIndex = REVIEW_INTERVALS.indexOf(card.reviewIntervalDays)
  if (rating === 'again') intervalIndex = 0
  else if (rating === 'hard') intervalIndex = Math.max(0, intervalIndex - 1)
  else if (rating === 'good') intervalIndex = Math.min(REVIEW_INTERVALS.length - 1, intervalIndex + 1)
  else intervalIndex = Math.min(REVIEW_INTERVALS.length - 1, intervalIndex + 2)

  const newInterval = REVIEW_INTERVALS[intervalIndex]
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  card.reviewIntervalDays = newInterval
  card.reviewCount += 1
  card.nextReviewAt = nextReview.toISOString()
  card.updatedAt = now()

  res.json(card)
})

export default router
