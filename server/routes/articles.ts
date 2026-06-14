import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'
import type { ArticleStatus } from '../mock-store.js'

const router = Router()

router.get('/', (req, res) => {
  let items = mockStore.articles.filter(
    (a) => a.userId === req.user.id && !a.isArchived,
  )
  const { category, status, tag, search } = req.query
  if (category) items = items.filter((a) => a.categoryId === category)
  if (status) items = items.filter((a) => a.status === status)
  if (tag) items = items.filter((a) => a.tagIds.includes(tag as string))
  if (search) {
    const q = (search as string).toLowerCase()
    items = items.filter(
      (a) => a.title.toLowerCase().includes(q) || a.excerpt?.toLowerCase().includes(q),
    )
  }
  res.json(items)
})

router.get('/:id', (req, res) => {
  const article = mockStore.articles.find((a) => a.id === req.params.id)
  if (!article) return res.status(404).json({ error: 'Not found' })
  res.json(article)
})

router.post('/', (req, res) => {
  const { title, categoryId, content, excerpt, status, tagIds } = req.body
  const article = {
    id: id(),
    userId: req.user.id,
    categoryId: categoryId ?? null,
    title,
    slug: slugify(title),
    content: content ?? { type: 'doc', content: [] },
    excerpt: excerpt ?? null,
    status: (status ?? 'not_started') as ArticleStatus,
    isArchived: false,
    tagIds: tagIds ?? [],
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.articles.push(article)
  res.status(201).json(article)
})

router.put('/:id', (req, res) => {
  const idx = mockStore.articles.findIndex((a) => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.articles[idx] = {
    ...mockStore.articles[idx],
    ...req.body,
    updatedAt: now(),
  }
  res.json(mockStore.articles[idx])
})

router.delete('/:id', (req, res) => {
  const idx = mockStore.articles.findIndex((a) => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.articles.splice(idx, 1)
  res.status(204).send()
})

router.post('/:id/duplicate', (req, res) => {
  const original = mockStore.articles.find((a) => a.id === req.params.id)
  if (!original) return res.status(404).json({ error: 'Not found' })
  const copy = {
    ...original,
    id: id(),
    title: `${original.title} (Copy)`,
    slug: slugify(`${original.title}-copy-${Date.now()}`),
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.articles.push(copy)
  res.status(201).json(copy)
})

router.post('/:id/archive', (req, res) => {
  const idx = mockStore.articles.findIndex((a) => a.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.articles[idx].isArchived = true
  mockStore.articles[idx].updatedAt = now()
  res.json(mockStore.articles[idx])
})

export default router
