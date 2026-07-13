import { Router } from 'express'
import { mockStore, id, now, slugify } from '../mock-store.js'
import {
  createDevAccount,
  createDevProject,
  deleteDevAccount,
  deleteDevProject,
  isDatabaseEnabled,
  listDevProjects,
  updateDevAccount,
  updateDevProject,
} from '../db/repositories.js'

const router = Router()

router.get('/projects', async (req, res) => {
  if (isDatabaseEnabled()) {
    return res.json(await listDevProjects(req.user.id))
  }

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

router.post('/projects', async (req, res) => {
  const { name, description } = req.body
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Project name is required' })
  }

  if (isDatabaseEnabled()) {
    const project = await createDevProject(req.user.id, req.body)
    return res.status(201).json(project)
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

router.put('/projects/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const project = await updateDevProject(req.user.id, req.params.id, req.body)
    if (!project) return res.status(404).json({ error: 'Not found' })
    return res.json(project)
  }

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

router.delete('/projects/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deleteDevProject(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.devProjects.findIndex(
    (p) => p.id === req.params.id && p.userId === req.user.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.devAccounts = mockStore.devAccounts.filter((a) => a.projectId !== req.params.id)
  mockStore.devProjects.splice(idx, 1)
  res.status(204).send()
})

router.post('/projects/:id/accounts', async (req, res) => {
  const project = mockStore.devProjects.find(
    (p) => p.id === req.params.id && p.userId === req.user.id,
  )

  const { kind, provider, environment, name, username, password, url, description } = req.body
  if (!name?.trim() || !username?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Name, identifier, and secret are required' })
  }

  if (isDatabaseEnabled()) {
    const account = await createDevAccount(req.user.id, req.params.id, req.body)
    if (!account) return res.status(404).json({ error: 'Not found' })
    return res.status(201).json(account)
  }

  if (!project) return res.status(404).json({ error: 'Not found' })

  const account = {
    id: id(),
    projectId: project.id,
    kind: kind ?? 'login',
    provider: provider?.trim() ? provider.trim() : null,
    environment: environment?.trim() ? environment.trim() : 'dev',
    name: name.trim(),
    username: username.trim(),
    password: String(password),
    url: url?.trim() ? url.trim() : null,
    description: description?.trim() ? description.trim() : null,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.devAccounts.push(account)
  res.status(201).json(account)
})

router.put('/projects/:projectId/accounts/:accountId', async (req, res) => {
  if (isDatabaseEnabled()) {
    const account = await updateDevAccount(req.user.id, req.params.projectId, req.params.accountId, req.body)
    if (!account) return res.status(404).json({ error: 'Not found' })
    return res.json(account)
  }

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
    kind: req.body.kind ?? current.kind,
    provider:
      req.body.provider !== undefined
        ? req.body.provider?.trim()
          ? req.body.provider.trim()
          : null
        : current.provider,
    environment: req.body.environment?.trim() ?? current.environment,
    name: req.body.name?.trim() ?? current.name,
    username: req.body.username?.trim() ?? current.username,
    password: req.body.password !== undefined ? String(req.body.password) : current.password,
    url:
      req.body.url !== undefined
        ? req.body.url?.trim()
          ? req.body.url.trim()
          : null
        : current.url,
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

router.delete('/projects/:projectId/accounts/:accountId', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deleteDevAccount(req.user.id, req.params.projectId, req.params.accountId)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

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
