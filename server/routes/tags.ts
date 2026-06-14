import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'

const router = Router()

router.get('/', (req, res) => {
  res.json(mockStore.tags.filter((t) => t.userId === req.user.id))
})

router.post('/', (req, res) => {
  const { name, color } = req.body
  const tag = {
    id: id(),
    userId: req.user.id,
    name,
    slug: slugify(name),
    color: color ?? null,
    createdAt: now(),
  }
  mockStore.tags.push(tag)
  res.status(201).json(tag)
})

router.delete('/:id', (req, res) => {
  const idx = mockStore.tags.findIndex((t) => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.tags.splice(idx, 1)
  res.status(204).send()
})

export default router
