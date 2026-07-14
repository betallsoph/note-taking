import { Router } from 'express'
import { mockStore, id, now } from '../mock-store.js'
import type { PersonalAccountCategory } from '../mock-store.js'
import {
  createPersonalAccount,
  deletePersonalAccount,
  getPersonalAccount,
  isDatabaseEnabled,
  listPersonalAccounts,
  updatePersonalAccount,
} from '../db/repositories.js'
import { queryParam } from './params.js'

const router = Router()

const CATEGORIES: PersonalAccountCategory[] = [
  'email',
  'social',
  'school',
  'streaming',
  'shopping',
  'finance',
  'other',
]

function asCategory(value: unknown): PersonalAccountCategory {
  return CATEGORIES.includes(value as PersonalAccountCategory)
    ? (value as PersonalAccountCategory)
    : 'other'
}

router.get('/', async (req, res) => {
  const filters = {
    category: queryParam(req.query.category),
    search: queryParam(req.query.search),
  }

  if (isDatabaseEnabled()) {
    return res.json(await listPersonalAccounts(req.user.id, filters))
  }

  let items = mockStore.personalAccounts.filter((a) => a.userId === req.user.id)
  if (filters.category) items = items.filter((a) => a.category === filters.category)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    items = items.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.username.toLowerCase().includes(q) ||
        (a.notes?.toLowerCase().includes(q) ?? false),
    )
  }
  items = [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
  res.json(items)
})

router.get('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const account = await getPersonalAccount(req.user.id, req.params.id)
    if (!account) return res.status(404).json({ error: 'Not found' })
    return res.json(account)
  }

  const account = mockStore.personalAccounts.find(
    (a) => a.id === req.params.id && a.userId === req.user.id,
  )
  if (!account) return res.status(404).json({ error: 'Not found' })
  res.json(account)
})

router.post('/', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : ''
  const password = typeof req.body.password === 'string' ? req.body.password : ''
  if (!name || !username || !password) {
    return res.status(400).json({ error: 'name, username, and password are required' })
  }

  if (isDatabaseEnabled()) {
    try {
      const account = await createPersonalAccount(req.user.id, req.body)
      return res.status(201).json(account)
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Invalid input',
      })
    }
  }

  const account = {
    id: id(),
    userId: req.user.id,
    category: asCategory(req.body.category),
    name,
    username,
    password,
    url:
      typeof req.body.url === 'string' && req.body.url.trim() ? req.body.url.trim() : null,
    notes:
      typeof req.body.notes === 'string' && req.body.notes.trim()
        ? req.body.notes.trim()
        : null,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.personalAccounts.unshift(account)
  res.status(201).json(account)
})

router.put('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const account = await updatePersonalAccount(req.user.id, req.params.id, req.body)
    if (!account) return res.status(404).json({ error: 'Not found' })
    return res.json(account)
  }

  const idx = mockStore.personalAccounts.findIndex(
    (a) => a.id === req.params.id && a.userId === req.user.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  const current = mockStore.personalAccounts[idx]
  mockStore.personalAccounts[idx] = {
    ...current,
    category:
      typeof req.body.category === 'string' ? asCategory(req.body.category) : current.category,
    name:
      typeof req.body.name === 'string' && req.body.name.trim()
        ? req.body.name.trim()
        : current.name,
    username:
      typeof req.body.username === 'string' && req.body.username.trim()
        ? req.body.username.trim()
        : current.username,
    password:
      typeof req.body.password === 'string' && req.body.password.length > 0
        ? req.body.password
        : current.password,
    url:
      'url' in req.body
        ? typeof req.body.url === 'string' && req.body.url.trim()
          ? req.body.url.trim()
          : null
        : current.url,
    notes:
      'notes' in req.body
        ? typeof req.body.notes === 'string' && req.body.notes.trim()
          ? req.body.notes.trim()
          : null
        : current.notes,
    updatedAt: now(),
  }
  res.json(mockStore.personalAccounts[idx])
})

router.delete('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deletePersonalAccount(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.personalAccounts.findIndex(
    (a) => a.id === req.params.id && a.userId === req.user.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.personalAccounts.splice(idx, 1)
  res.status(204).send()
})

export default router
