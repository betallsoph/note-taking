import { Router } from 'express'
import { mockStore, id, now } from '../mock-store.js'
import {
  createReminder,
  deleteReminder,
  getReminder,
  isDatabaseEnabled,
  listDueReminders,
  listReminders,
  updateReminder,
} from '../db/repositories.js'
import { queryParam } from './params.js'

const router = Router()

function sortReminders<T extends { remindAt: string; isCompleted: boolean }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1
    return new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
  })
}

router.get('/', async (req, res) => {
  if (isDatabaseEnabled()) {
    const items = await listReminders(req.user.id, {
      status: queryParam(req.query.status),
      search: queryParam(req.query.search),
    })
    return res.json(items)
  }

  let items = mockStore.reminders.filter((r) => r.userId === req.user.id)
  const status = queryParam(req.query.status)
  const search = queryParam(req.query.search)
  const nowMs = Date.now()

  if (status === 'completed') items = items.filter((r) => r.isCompleted)
  else if (status === 'upcoming') {
    items = items.filter((r) => !r.isCompleted && new Date(r.remindAt).getTime() > nowMs)
  } else if (status === 'overdue') {
    items = items.filter((r) => !r.isCompleted && new Date(r.remindAt).getTime() <= nowMs)
  } else if (status === 'active') {
    items = items.filter((r) => !r.isCompleted)
  }

  if (search) {
    const q = search.toLowerCase()
    items = items.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.body?.toLowerCase().includes(q) ?? false),
    )
  }

  res.json(sortReminders(items))
})

router.get('/due', async (req, res) => {
  if (isDatabaseEnabled()) {
    return res.json(await listDueReminders(req.user.id))
  }

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  const items = mockStore.reminders.filter(
    (r) =>
      r.userId === req.user.id &&
      !r.isCompleted &&
      new Date(r.remindAt).getTime() <= endOfToday.getTime(),
  )
  res.json(sortReminders(items))
})

router.get('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const reminder = await getReminder(req.user.id, req.params.id)
    if (!reminder) return res.status(404).json({ error: 'Not found' })
    return res.json(reminder)
  }

  const reminder = mockStore.reminders.find(
    (r) => r.id === req.params.id && r.userId === req.user.id,
  )
  if (!reminder) return res.status(404).json({ error: 'Not found' })
  res.json(reminder)
})

router.post('/', async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  if (!title) return res.status(400).json({ error: 'Title is required' })
  if (!req.body.remindAt) return res.status(400).json({ error: 'remindAt is required' })

  if (isDatabaseEnabled()) {
    const reminder = await createReminder(req.user.id, { ...req.body, title })
    return res.status(201).json(reminder)
  }

  const reminder = {
    id: id(),
    userId: req.user.id,
    title,
    body: typeof req.body.body === 'string' && req.body.body.trim() ? req.body.body.trim() : null,
    remindAt: new Date(String(req.body.remindAt)).toISOString(),
    isCompleted: false,
    completedAt: null,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.reminders.push(reminder)
  res.status(201).json(reminder)
})

router.put('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const reminder = await updateReminder(req.user.id, req.params.id, req.body)
    if (!reminder) return res.status(404).json({ error: 'Not found' })
    return res.json(reminder)
  }

  const idx = mockStore.reminders.findIndex(
    (r) => r.id === req.params.id && r.userId === req.user.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  const current = mockStore.reminders[idx]
  const isCompleted =
    typeof req.body.isCompleted === 'boolean' ? req.body.isCompleted : current.isCompleted

  mockStore.reminders[idx] = {
    ...current,
    title:
      typeof req.body.title === 'string' && req.body.title.trim()
        ? req.body.title.trim()
        : current.title,
    body:
      'body' in req.body
        ? typeof req.body.body === 'string' && req.body.body.trim()
          ? req.body.body.trim()
          : null
        : current.body,
    remindAt: req.body.remindAt
      ? new Date(String(req.body.remindAt)).toISOString()
      : current.remindAt,
    isCompleted,
    completedAt: isCompleted
      ? current.completedAt ?? now()
      : null,
    updatedAt: now(),
  }
  res.json(mockStore.reminders[idx])
})

router.delete('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deleteReminder(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.reminders.findIndex(
    (r) => r.id === req.params.id && r.userId === req.user.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.reminders.splice(idx, 1)
  res.status(204).send()
})

export default router
