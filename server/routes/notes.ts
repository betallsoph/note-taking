import { Router } from 'express'
import { mockStore, id, now } from '../mock-store.js'
import {
  createNote,
  deleteNote,
  getNote,
  isDatabaseEnabled,
  listNotes,
  updateNote,
} from '../db/repositories.js'
import {
  createMongoNote,
  deleteMongoNote,
  getMongoNote,
  listMongoNotes,
  updateMongoNote,
} from '../db/mongo-notes.js'
import { isMongoEnabled } from '../db/mongo.js'
import { queryParam } from './params.js'

const router = Router()

router.get('/', async (req, res) => {
  const filters = {
    search: queryParam(req.query.search),
    pinned: queryParam(req.query.pinned),
  }

  // Prefer Atlas for free-form notes when configured.
  if (isMongoEnabled()) {
    return res.json(await listMongoNotes(req.user.id, filters))
  }

  if (isDatabaseEnabled()) {
    return res.json(await listNotes(req.user.id, filters))
  }

  let items = mockStore.notes.filter((n) => n.userId === req.user.id)
  if (filters.pinned === 'true') items = items.filter((n) => n.isPinned)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    items = items.filter((n) => {
      const markdown =
        typeof n.content.markdown === 'string' ? n.content.markdown.toLowerCase() : ''
      return n.title.toLowerCase().includes(q) || markdown.includes(q)
    })
  }
  items = [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
  res.json(items)
})

router.get('/:id', async (req, res) => {
  if (isMongoEnabled()) {
    const note = await getMongoNote(req.user.id, req.params.id)
    if (!note) return res.status(404).json({ error: 'Not found' })
    return res.json(note)
  }

  if (isDatabaseEnabled()) {
    const note = await getNote(req.user.id, req.params.id)
    if (!note) return res.status(404).json({ error: 'Not found' })
    return res.json(note)
  }

  const note = mockStore.notes.find((n) => n.id === req.params.id && n.userId === req.user.id)
  if (!note) return res.status(404).json({ error: 'Not found' })
  res.json(note)
})

router.post('/', async (req, res) => {
  if (isMongoEnabled()) {
    const note = await createMongoNote(req.user.id, req.body)
    return res.status(201).json(note)
  }

  if (isDatabaseEnabled()) {
    const note = await createNote(req.user.id, req.body)
    return res.status(201).json(note)
  }

  const title =
    typeof req.body.title === 'string' && req.body.title.trim()
      ? req.body.title.trim()
      : 'Untitled'
  const note = {
    id: id(),
    userId: req.user.id,
    title,
    content: req.body.content ?? { markdown: '' },
    isPinned: Boolean(req.body.isPinned),
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.notes.unshift(note)
  res.status(201).json(note)
})

router.put('/:id', async (req, res) => {
  if (isMongoEnabled()) {
    const note = await updateMongoNote(req.user.id, req.params.id, req.body)
    if (!note) return res.status(404).json({ error: 'Not found' })
    return res.json(note)
  }

  if (isDatabaseEnabled()) {
    const note = await updateNote(req.user.id, req.params.id, req.body)
    if (!note) return res.status(404).json({ error: 'Not found' })
    return res.json(note)
  }

  const idx = mockStore.notes.findIndex((n) => n.id === req.params.id && n.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  const current = mockStore.notes[idx]
  mockStore.notes[idx] = {
    ...current,
    title:
      typeof req.body.title === 'string' && req.body.title.trim()
        ? req.body.title.trim()
        : current.title,
    content: req.body.content !== undefined ? req.body.content : current.content,
    isPinned:
      typeof req.body.isPinned === 'boolean' ? req.body.isPinned : current.isPinned,
    updatedAt: now(),
  }
  res.json(mockStore.notes[idx])
})

router.delete('/:id', async (req, res) => {
  if (isMongoEnabled()) {
    const deleted = await deleteMongoNote(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  if (isDatabaseEnabled()) {
    const deleted = await deleteNote(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.notes.findIndex((n) => n.id === req.params.id && n.userId === req.user.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.notes.splice(idx, 1)
  res.status(204).send()
})

export default router
