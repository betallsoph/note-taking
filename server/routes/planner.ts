import { Router } from 'express'
import { mockStore, id, now } from '../mock-store.js'
import type { PlannerHorizon, PlannerItem, PlannerScope, PlannerStatus } from '../mock-store.js'
import {
  createPlannerItem,
  deletePlannerItem,
  getPlannerItem,
  isDatabaseEnabled,
  listPlannerItems,
  updatePlannerItem,
} from '../db/repositories.js'
import { queryParam } from './params.js'

const router = Router()

const PLANNER_HORIZON_ORDER: Record<PlannerHorizon, number> = {
  now: 0,
  next: 1,
  later: 2,
  someday: 3,
}

function sortPlannerItems(items: PlannerItem[]) {
  return [...items].sort((a, b) => {
    const horizonDiff = PLANNER_HORIZON_ORDER[a.horizon] - PLANNER_HORIZON_ORDER[b.horizon]
    if (horizonDiff !== 0) return horizonDiff
    const aDone = a.status === 'done' || a.status === 'dropped'
    const bDone = b.status === 'done' || b.status === 'dropped'
    if (aDone !== bDone) return aDone ? 1 : -1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

function filterMockPlannerItems(
  items: PlannerItem[],
  filters: {
    status?: string
    horizon?: string
    scope?: string
    project?: string
    search?: string
  },
) {
  const query = filters.search?.toLowerCase()
  const project = filters.project?.toLowerCase()

  return sortPlannerItems(
    items.filter((item) => {
      if (filters.status && item.status !== filters.status) return false
      if (filters.horizon && item.horizon !== filters.horizon) return false
      if (filters.scope && item.scope !== filters.scope) return false
      if (project && (item.projectName?.toLowerCase() ?? '') !== project) return false
      if (
        query &&
        !item.title.toLowerCase().includes(query) &&
        !(item.body?.toLowerCase().includes(query) ?? false)
      ) {
        return false
      }
      return true
    }),
  )
}

function asPlannerHorizon(value: unknown): PlannerHorizon {
  const horizons: PlannerHorizon[] = ['now', 'next', 'later', 'someday']
  return horizons.includes(value as PlannerHorizon) ? (value as PlannerHorizon) : 'later'
}

function asPlannerStatus(value: unknown): PlannerStatus {
  const statuses: PlannerStatus[] = ['open', 'doing', 'done', 'dropped']
  return statuses.includes(value as PlannerStatus) ? (value as PlannerStatus) : 'open'
}

function asPlannerScope(value: unknown): PlannerScope {
  const scopes: PlannerScope[] = ['personal', 'project']
  return scopes.includes(value as PlannerScope) ? (value as PlannerScope) : 'personal'
}

function optionalString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function optionalTargetDate(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  return new Date(String(value)).toISOString()
}

router.get('/', async (req, res) => {
  const filters = {
    status: queryParam(req.query.status),
    horizon: queryParam(req.query.horizon),
    scope: queryParam(req.query.scope),
    project: queryParam(req.query.project),
    search: queryParam(req.query.search),
  }

  if (isDatabaseEnabled()) {
    const items = await listPlannerItems(req.user.id, filters)
    return res.json(items)
  }

  const items = filterMockPlannerItems(
    mockStore.plannerItems.filter((item) => item.userId === req.user.id),
    filters,
  )
  res.json(items)
})

router.get('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const item = await getPlannerItem(req.user.id, req.params.id)
    if (!item) return res.status(404).json({ error: 'Not found' })
    return res.json(item)
  }

  const item = mockStore.plannerItems.find(
    (entry) => entry.id === req.params.id && entry.userId === req.user.id,
  )
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

router.post('/', async (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : ''
  if (!title) return res.status(400).json({ error: 'Title is required' })

  const scope = asPlannerScope(req.body.scope)
  const projectName = optionalString(req.body.projectName)
  if (scope === 'project' && !projectName) {
    return res.status(400).json({ error: 'projectName is required when scope is project' })
  }

  if (isDatabaseEnabled()) {
    try {
      const item = await createPlannerItem(req.user.id, { ...req.body, title })
      return res.status(201).json(item)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid request'
      return res.status(400).json({ error: message })
    }
  }

  const item: PlannerItem = {
    id: id(),
    userId: req.user.id,
    title,
    body:
      typeof req.body.body === 'string' && req.body.body.trim() ? req.body.body.trim() : null,
    scope,
    projectName: scope === 'project' ? projectName : null,
    horizon: asPlannerHorizon(req.body.horizon),
    status: asPlannerStatus(req.body.status),
    targetDate:
      req.body.targetDate != null && req.body.targetDate !== ''
        ? new Date(String(req.body.targetDate)).toISOString()
        : null,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.plannerItems.push(item)
  res.status(201).json(item)
})

router.put('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    try {
      const item = await updatePlannerItem(req.user.id, req.params.id, req.body)
      if (!item) return res.status(404).json({ error: 'Not found' })
      return res.json(item)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid request'
      return res.status(400).json({ error: message })
    }
  }

  const idx = mockStore.plannerItems.findIndex(
    (entry) => entry.id === req.params.id && entry.userId === req.user.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })

  const current = mockStore.plannerItems[idx]
  const scope = 'scope' in req.body ? asPlannerScope(req.body.scope) : current.scope
  const projectName =
    'projectName' in req.body ? optionalString(req.body.projectName) : current.projectName
  if (scope === 'project' && !projectName) {
    return res.status(400).json({ error: 'projectName is required when scope is project' })
  }

  const targetDate = optionalTargetDate(req.body.targetDate)

  mockStore.plannerItems[idx] = {
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
    scope,
    projectName: scope === 'project' ? projectName : null,
    horizon: 'horizon' in req.body ? asPlannerHorizon(req.body.horizon) : current.horizon,
    status: 'status' in req.body ? asPlannerStatus(req.body.status) : current.status,
    targetDate: targetDate === undefined ? current.targetDate : targetDate,
    updatedAt: now(),
  }
  res.json(mockStore.plannerItems[idx])
})

router.delete('/:id', async (req, res) => {
  if (isDatabaseEnabled()) {
    const deleted = await deletePlannerItem(req.user.id, req.params.id)
    if (!deleted) return res.status(404).json({ error: 'Not found' })
    return res.status(204).send()
  }

  const idx = mockStore.plannerItems.findIndex(
    (entry) => entry.id === req.params.id && entry.userId === req.user.id,
  )
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  mockStore.plannerItems.splice(idx, 1)
  res.status(204).send()
})

export default router
