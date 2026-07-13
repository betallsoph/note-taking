import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'
import { createTag, deleteTag, isDatabaseEnabled, listTags } from '../db/repositories.js'

const router = Router()

router.get('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    return res.json(await listTags(req.user.id))
  }
  res.json(mockStore.tags.filter((t) => t.userId === req.user.id))
})

router.post('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    const tag = await createTag(req.user.id, req.body)
    return res.status(201).json(tag)
  }

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

router.delete('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deleteTag(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.tags.findIndex((t) => t.id === req.params.id && t.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.tags.splice(idx, 1)
  res.status(204).send()
})

export default router
