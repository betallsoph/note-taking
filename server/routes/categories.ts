import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'
import {
  createCategory,
  deleteCategory,
  isDatabaseEnabled,
  listCategories,
  updateCategory,
} from '../db/repositories.js'

const router = Router()

router.get('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    return res.json(await listCategories(req.user.id))
  }
  res.json(mockStore.categories.filter((c) => c.userId === req.user.id))
})

router.post('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    const category = await createCategory(req.user.id, req.body)
    return res.status(201).json(category)
  }

  const { name, description, icon, color } = req.body
  const category = {
    id: id(),
    userId: req.user.id,
    name,
    slug: slugify(name),
    description: description ?? null,
    icon: icon ?? null,
    color: color ?? null,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.categories.push(category)
  res.status(201).json(category)
})

router.put('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const category = await updateCategory(req.user.id, req.params.id, req.body)
    if (!category) return res.status(404).json({ error: 'Not found' })
    return res.json(category)
  }

  const idx = mockStore.categories.findIndex((c) => c.id === req.params.id && c.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.categories[idx] = { ...mockStore.categories[idx], ...req.body, updatedAt: now() }
  res.json(mockStore.categories[idx])
})

router.delete('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deleteCategory(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.categories.findIndex((c) => c.id === req.params.id && c.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.categories.splice(idx, 1)
  res.status(204).send()
})

export default router
