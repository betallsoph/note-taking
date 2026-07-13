import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'
import type { RoadmapItemStatus } from '../mock-store.js'
import {
  addRoadmapItem,
  createRoadmap,
  deleteRoadmap,
  deleteRoadmapItem,
  getRoadmap,
  isDatabaseEnabled,
  listRoadmaps,
  updateRoadmap,
  updateRoadmapItem,
} from '../db/repositories.js'

const router = Router()

router.get('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    return res.json(await listRoadmaps(req.user.id))
  }

  const roadmaps = mockStore.roadmaps.filter((r) => r.userId === req.user.id)
  const withItems = roadmaps.map((r) => ({
    ...r,
    items: mockStore.roadmapItems
      .filter((i) => i.roadmapId === r.id)
      .sort((a, b) => a.orderIndex - b.orderIndex),
  }))
  res.json(withItems)
})

router.get('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const roadmap = await getRoadmap(req.user.id, req.params.id)
    if (!roadmap) return res.status(404).json({ error: 'Not found' })
    return res.json(roadmap)
  }

  const roadmap = mockStore.roadmaps.find((r) => r.id === req.params.id && r.userId === req.user.id)
  if (!roadmap) return res.status(404).json({ error: 'Not found' })
  const items = mockStore.roadmapItems
    .filter((i) => i.roadmapId === roadmap.id)
    .sort((a, b) => a.orderIndex - b.orderIndex)
  res.json({ ...roadmap, items })
})

router.post('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    const roadmap = await createRoadmap(req.user.id, req.body)
    return res.status(201).json(roadmap)
  }

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

router.put('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const roadmap = await updateRoadmap(req.user.id, req.params.id, req.body)
    if (!roadmap) return res.status(404).json({ error: 'Not found' })
    return res.json(roadmap)
  }

  const idx = mockStore.roadmaps.findIndex((r) => r.id === req.params.id && r.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.roadmaps[idx] = { ...mockStore.roadmaps[idx], ...req.body, updatedAt: now() }
  res.json(mockStore.roadmaps[idx])
})

router.delete('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deleteRoadmap(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.roadmaps.findIndex((r) => r.id === req.params.id && r.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.roadmapItems = mockStore.roadmapItems.filter((i) => i.roadmapId !== req.params.id)
  mockStore.roadmaps.splice(idx, 1)
  res.status(204).send()
})

router.post('/:id/items', async (req, res) => {
  if (isDatabaseEnabled()) {
    const item = await addRoadmapItem(req.user.id, req.params.id, req.body)
    if (!item) return res.status(404).json({ error: 'Not found' })
    return res.status(201).json(item)
  }

  const roadmap = mockStore.roadmaps.find((r) => r.id === req.params.id && r.userId === req.user.id)
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

router.put('/:roadmapId/items/:itemId', async (req, res) => {
  if (isDatabaseEnabled()) {
    const item = await updateRoadmapItem(req.user.id, req.params.roadmapId, req.params.itemId, req.body)
    if (!item) return res.status(404).json({ error: 'Not found' })
    return res.json(item)
  }

  const roadmap = mockStore.roadmaps.find((r) => r.id === req.params.roadmapId && r.userId === req.user.id)
  if (!roadmap) return res.status(404).json({ error: 'Not found' })
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

router.delete('/:roadmapId/items/:itemId', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deleteRoadmapItem(req.user.id, req.params.roadmapId, req.params.itemId)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const roadmap = mockStore.roadmaps.find((r) => r.id === req.params.roadmapId && r.userId === req.user.id)
  if (!roadmap) return res.status(404).json({ error: 'Not found' })
  const idx = mockStore.roadmapItems.findIndex(
    (i) => i.id === req.params.itemId && i.roadmapId === req.params.roadmapId,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.roadmapItems.splice(idx, 1)
  res.status(204).send()
})

export default router
