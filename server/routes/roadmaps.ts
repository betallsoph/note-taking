import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'
import type { RoadmapItemStatus } from '../mock-store.js'

const router = Router()

router.get('/', (req, res) => {
  const roadmaps = mockStore.roadmaps.filter((r) => r.userId === req.user.id)
  const withItems = roadmaps.map((r) => ({
    ...r,
    items: mockStore.roadmapItems
      .filter((i) => i.roadmapId === r.id)
      .sort((a, b) => a.orderIndex - b.orderIndex),
  }))
  res.json(withItems)
})

router.get('/:id', (req, res) => {
  const roadmap = mockStore.roadmaps.find((r) => r.id === req.params.id)
  if (!roadmap) return res.status(404).json({ error: 'Not found' })
  const items = mockStore.roadmapItems
    .filter((i) => i.roadmapId === roadmap.id)
    .sort((a, b) => a.orderIndex - b.orderIndex)
  res.json({ ...roadmap, items })
})

router.post('/', (req, res) => {
  const { title, description } = req.body
  const roadmap = {
    id: id(),
    userId: req.user.id,
    title,
    slug: slugify(title),
    description: description ?? null,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.roadmaps.push(roadmap)
  res.status(201).json(roadmap)
})

router.put('/:id', (req, res) => {
  const idx = mockStore.roadmaps.findIndex((r) => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.roadmaps[idx] = { ...mockStore.roadmaps[idx], ...req.body, updatedAt: now() }
  res.json(mockStore.roadmaps[idx])
})

router.delete('/:id', (req, res) => {
  const idx = mockStore.roadmaps.findIndex((r) => r.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.roadmapItems = mockStore.roadmapItems.filter((i) => i.roadmapId !== req.params.id)
  mockStore.roadmaps.splice(idx, 1)
  res.status(204).send()
})

router.post('/:id/items', (req, res) => {
  const roadmap = mockStore.roadmaps.find((r) => r.id === req.params.id)
  if (!roadmap) return res.status(404).json({ error: 'Not found' })
  const existing = mockStore.roadmapItems.filter((i) => i.roadmapId === roadmap.id)
  const item = {
    id: id(),
    roadmapId: roadmap.id,
    title: req.body.title,
    description: req.body.description ?? null,
    status: (req.body.status ?? 'not_started') as RoadmapItemStatus,
    orderIndex: existing.length,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.roadmapItems.push(item)
  res.status(201).json(item)
})

router.put('/:roadmapId/items/:itemId', (req, res) => {
  const idx = mockStore.roadmapItems.findIndex(
    (i) => i.id === req.params.itemId && i.roadmapId === req.params.roadmapId,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.roadmapItems[idx] = {
    ...mockStore.roadmapItems[idx],
    ...req.body,
    updatedAt: now(),
  }
  res.json(mockStore.roadmapItems[idx])
})

router.delete('/:roadmapId/items/:itemId', (req, res) => {
  const idx = mockStore.roadmapItems.findIndex(
    (i) => i.id === req.params.itemId && i.roadmapId === req.params.roadmapId,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.roadmapItems.splice(idx, 1)
  res.status(204).send()
})

export default router
