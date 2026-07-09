import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'

const router = Router()

router.get('/projects', (req, res) => {
  const projects = mockStore.devProjects
    .filter((p) => p.userId === req.user.id)
    .map((p) => ({
      ...p,
      accounts: mockStore.devAccounts
        .filter((a) => a.projectId === p.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
  res.json(projects)
})

router.post('/projects', (req, res) => {
  const { name, description } = req.body
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Project name is required' })
  }
  const project = {
    id: id(),
    userId: req.user.id,
    name: name.trim(),
    slug: slugify(name),
    description: description?.trim() ? description.trim() : null,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.devProjects.push(project)
  res.status(201).json({ ...project, accounts: [] })
})

router.put('/projects/:id', (req, res) => {
  const idx = mockStore.devProjects.findIndex(
    (p) => p.id === req.params.id && p.userId === req.user.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  const current = mockStore.devProjects[idx]
  const name = req.body.name?.trim() ?? current.name
  mockStore.devProjects[idx] = {
    ...current,
    name,
    slug: req.body.name ? slugify(name) : current.slug,
    description:
      req.body.description !== undefined
        ? req.body.description?.trim()
          ? req.body.description.trim()
          : null
        : current.description,
    updatedAt: now(),
  }
  res.json(mockStore.devProjects[idx])
})

router.delete('/projects/:id', (req, res) => {
  const idx = mockStore.devProjects.findIndex(
    (p) => p.id === req.params.id && p.userId === req.user.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.devAccounts = mockStore.devAccounts.filter((a) => a.projectId !== req.params.id)
  mockStore.devProjects.splice(idx, 1)
  res.status(204).send()
})

router.post('/projects/:id/accounts', (req, res) => {
  const project = mockStore.devProjects.find(
    (p) => p.id === req.params.id && p.userId === req.user.id,
  )
  if (!project) return res.status(404).json({ error: 'Not found' })

  const { name, username, password, description } = req.body
  if (!name?.trim() || !username?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Name, username, and password are required' })
  }

  const account = {
    id: id(),
    projectId: project.id,
    name: name.trim(),
    username: username.trim(),
    password: String(password),
    description: description?.trim() ? description.trim() : null,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.devAccounts.push(account)
  res.status(201).json(account)
})

router.put('/projects/:projectId/accounts/:accountId', (req, res) => {
  const project = mockStore.devProjects.find(
    (p) => p.id === req.params.projectId && p.userId === req.user.id,
  )
  if (!project) return res.status(404).json({ error: 'Not found' })

  const idx = mockStore.devAccounts.findIndex(
    (a) => a.id === req.params.accountId && a.projectId === project.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  const current = mockStore.devAccounts[idx]
  mockStore.devAccounts[idx] = {
    ...current,
    name: req.body.name?.trim() ?? current.name,
    username: req.body.username?.trim() ?? current.username,
    password: req.body.password !== undefined ? String(req.body.password) : current.password,
    description:
      req.body.description !== undefined
        ? req.body.description?.trim()
          ? req.body.description.trim()
          : null
        : current.description,
    updatedAt: now(),
  }
  res.json(mockStore.devAccounts[idx])
})

router.delete('/projects/:projectId/accounts/:accountId', (req, res) => {
  const project = mockStore.devProjects.find(
    (p) => p.id === req.params.projectId && p.userId === req.user.id,
  )
  if (!project) return res.status(404).json({ error: 'Not found' })

  const idx = mockStore.devAccounts.findIndex(
    (a) => a.id === req.params.accountId && a.projectId === project.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.devAccounts.splice(idx, 1)
  res.status(204).send()
})

export default router
