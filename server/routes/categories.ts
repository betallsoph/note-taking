import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(mockStore.categories.filter((c) => c.userId === req.user.id))
})

router.post('/', (req, res) => {
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

router.put('/:id', (req, res) => {
  const idx = mockStore.categories.findIndex((c) => c.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.categories[idx] = { ...mockStore.categories[idx], ...req.body, updatedAt: now() }
  res.json(mockStore.categories[idx])
})

router.delete('/:id', (req, res) => {
  const idx = mockStore.categories.findIndex((c) => c.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.categories.splice(idx, 1)
  res.status(204).send()
})

export default router
