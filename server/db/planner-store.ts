import {
  createPlannerItem,
  deletePlannerItem,
  getPlannerItem,
  isDatabaseEnabled,
  listPlannerItems,
  updatePlannerItem,
  type PlannerListFilters,
} from './repositories.js'
import {
  createMongoPlannerItem,
  deleteMongoPlannerItem,
  getMongoPlannerItem,
  listMongoPlannerItems,
  updateMongoPlannerItem,
  upsertMongoPlannerItem,
} from './mongo-planner.js'
import { isMongoEnabled, mongoConnectErrorMessage } from './mongo.js'
import {
  activePlannerStoreLabel,
  resolvePlannerStoreMode,
  usesMongoPlannerBackup,
  type PlannerStoreLabel,
} from './planner-config.js'
import { mockStore, id, now, type PlannerItem } from '../mock-store.js'
import { isMissingRelation } from './pg-error.js'

export type PlannerStore = PlannerStoreLabel

function queueMongoBackup(task: () => Promise<void>) {
  task().catch((error) => console.error('Mongo planner backup failed (non-fatal):', error))
}

function backupPlannerToMongo(item: PlannerItem) {
  if (!usesMongoPlannerBackup()) return
  queueMongoBackup(() => upsertMongoPlannerItem(item).then(() => undefined))
}

function backupDeleteFromMongo(userId: string, plannerItemId: string) {
  if (!usesMongoPlannerBackup()) return
  queueMongoBackup(() => deleteMongoPlannerItem(userId, plannerItemId).then(() => undefined))
}

export function activePlannerStore(): PlannerStore {
  return activePlannerStoreLabel()
}

const PLANNER_HORIZON_ORDER: Record<PlannerItem['horizon'], number> = {
  now: 0,
  next: 1,
  later: 2,
  someday: 3,
}

function sortMockPlannerItems(items: PlannerItem[]) {
  return [...items].sort((a, b) => {
    const horizonDiff = PLANNER_HORIZON_ORDER[a.horizon] - PLANNER_HORIZON_ORDER[b.horizon]
    if (horizonDiff !== 0) return horizonDiff
    const aDone = a.status === 'done' || a.status === 'dropped'
    const bDone = b.status === 'done' || b.status === 'dropped'
    if (aDone !== bDone) return aDone ? 1 : -1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

function filterMockPlannerItems(userId: string, filters: PlannerListFilters) {
  const query = filters.search?.toLowerCase()
  const project = filters.project?.toLowerCase()

  return sortMockPlannerItems(
    mockStore.plannerItems.filter((item) => {
      if (item.userId !== userId) return false
      if (filters.status && item.status !== filters.status) return false
      if (filters.horizon && item.horizon !== filters.horizon) return false
      if (filters.scope && item.scope !== filters.scope) return false
      if (project && (item.projectName?.toLowerCase() ?? '') !== project) return false
      if (query) {
        const markdown =
          typeof item.content.markdown === 'string' ? item.content.markdown.toLowerCase() : ''
        if (!item.title.toLowerCase().includes(query) && !markdown.includes(query)) return false
      }
      return true
    }),
  )
}

function normalizePlannerContent(body: Record<string, unknown>): Record<string, unknown> {
  if (body.content !== undefined) {
    return body.content && typeof body.content === 'object' && !Array.isArray(body.content)
      ? (body.content as Record<string, unknown>)
      : { markdown: '' }
  }
  if (typeof body.body === 'string' && body.body.trim()) return { markdown: body.body.trim() }
  return { markdown: '' }
}

async function listFromNeon(userId: string, filters: PlannerListFilters) {
  if (!isDatabaseEnabled()) return null
  try {
    return await listPlannerItems(userId, filters)
  } catch (error) {
    console.error('Neon list planner items failed:', error)
    return null
  }
}

async function listFromAtlas(userId: string, filters: PlannerListFilters) {
  try {
    return await listMongoPlannerItems(userId, filters)
  } catch (error) {
    console.error('Atlas list planner items failed:', error)
    if (process.env.NODE_ENV === 'production') throw error
    return null
  }
}

export async function listPlannerItemsAnywhere(userId: string, filters: PlannerListFilters = {}) {
  const mode = resolvePlannerStoreMode()

  if (mode === 'atlas') {
    const items = await listFromAtlas(userId, filters)
    if (items) return items
    if (process.env.NODE_ENV === 'production') throw new Error('Atlas planner unavailable')
  }

  if (mode === 'neon' || mode === 'backup') {
    const items = await listFromNeon(userId, filters)
    if (items) return items
    if (process.env.NODE_ENV === 'production') throw new Error('Neon planner unavailable')
  }

  return filterMockPlannerItems(userId, filters)
}

export async function getPlannerItemAnywhere(userId: string, plannerItemId: string) {
  const mode = resolvePlannerStoreMode()

  if (mode === 'atlas') {
    try {
      const item = await getMongoPlannerItem(userId, plannerItemId)
      if (item) return item
    } catch (error) {
      console.error('Atlas get planner item failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  if (mode === 'neon' || mode === 'backup') {
    try {
      const item = await getPlannerItem(userId, plannerItemId)
      if (item) return item
    } catch (error) {
      console.error('Neon get planner item failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  return (
    mockStore.plannerItems.find((item) => item.id === plannerItemId && item.userId === userId) ??
    null
  )
}

export async function createPlannerItemAnywhere(userId: string, body: Record<string, unknown>) {
  const mode = resolvePlannerStoreMode()

  if (mode === 'atlas') {
    try {
      return await createMongoPlannerItem(userId, body)
    } catch (error) {
      console.error('Atlas create planner item failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
      if (error instanceof Error && error.message.includes('required')) throw error
    }
  }

  if (mode === 'neon' || mode === 'backup') {
    try {
      const item = await createPlannerItem(userId, body)
      backupPlannerToMongo(item)
      return item
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) throw error
      if (process.env.NODE_ENV === 'production') throw error
      if (isMissingRelation(error) || isSchemaBootstrapError(error)) {
        console.error('Neon planner unavailable — falling back to mock:', error)
      } else {
        throw error
      }
    }
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) throw new Error('Title is required')

  const scope =
    body.scope === 'personal' || body.scope === 'project' ? body.scope : 'personal'
  const projectName =
    typeof body.projectName === 'string' && body.projectName.trim()
      ? body.projectName.trim()
      : null
  if (scope === 'project' && !projectName) {
    throw new Error('projectName is required when scope is project')
  }

  const item: PlannerItem = {
    id: id(),
    userId,
    title,
    content: normalizePlannerContent(body),
    scope,
    projectName: scope === 'project' ? projectName : null,
    horizon:
      body.horizon === 'now' ||
      body.horizon === 'next' ||
      body.horizon === 'later' ||
      body.horizon === 'someday'
        ? body.horizon
        : 'later',
    status:
      body.status === 'open' ||
      body.status === 'doing' ||
      body.status === 'done' ||
      body.status === 'dropped'
        ? body.status
        : 'open',
    targetDate:
      body.targetDate != null && body.targetDate !== ''
        ? new Date(String(body.targetDate)).toISOString()
        : null,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.plannerItems.push(item)
  return item
}

export async function updatePlannerItemAnywhere(
  userId: string,
  plannerItemId: string,
  body: Record<string, unknown>,
) {
  const mode = resolvePlannerStoreMode()

  if (mode === 'atlas') {
    try {
      const item = await updateMongoPlannerItem(userId, plannerItemId, body)
      if (item) return item
    } catch (error) {
      console.error('Atlas update planner item failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
      if (error instanceof Error && error.message.includes('required')) throw error
    }
  }

  if (mode === 'neon' || mode === 'backup') {
    try {
      const item = await updatePlannerItem(userId, plannerItemId, body)
      if (item) {
        backupPlannerToMongo(item)
        return item
      }
    } catch (error) {
      console.error('Neon update planner item failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
      if (error instanceof Error && error.message.includes('required')) throw error
    }
  }

  const idx = mockStore.plannerItems.findIndex(
    (item) => item.id === plannerItemId && item.userId === userId,
  )
  if (idx === -1) return null

  const current = mockStore.plannerItems[idx]
  const scope =
    body.scope === 'personal' || body.scope === 'project' ? body.scope : current.scope
  const projectName =
    'projectName' in body
      ? typeof body.projectName === 'string' && body.projectName.trim()
        ? body.projectName.trim()
        : null
      : current.projectName
  if (scope === 'project' && !projectName) {
    throw new Error('projectName is required when scope is project')
  }

  const targetDate =
    body.targetDate === undefined
      ? current.targetDate
      : body.targetDate === null || body.targetDate === ''
        ? null
        : new Date(String(body.targetDate)).toISOString()

  mockStore.plannerItems[idx] = {
    ...current,
    title:
      typeof body.title === 'string' && body.title.trim() ? body.title.trim() : current.title,
    content:
      body.content !== undefined || 'body' in body
        ? normalizePlannerContent(body)
        : current.content,
    scope,
    projectName: scope === 'project' ? projectName : null,
    horizon:
      body.horizon === 'now' ||
      body.horizon === 'next' ||
      body.horizon === 'later' ||
      body.horizon === 'someday'
        ? body.horizon
        : current.horizon,
    status:
      body.status === 'open' ||
      body.status === 'doing' ||
      body.status === 'done' ||
      body.status === 'dropped'
        ? body.status
        : current.status,
    targetDate,
    updatedAt: now(),
  }
  return mockStore.plannerItems[idx]
}

export async function deletePlannerItemAnywhere(userId: string, plannerItemId: string) {
  const mode = resolvePlannerStoreMode()

  if (mode === 'atlas') {
    try {
      if (await deleteMongoPlannerItem(userId, plannerItemId)) return true
    } catch (error) {
      console.error('Atlas delete planner item failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  if (mode === 'neon' || mode === 'backup') {
    try {
      if (await deletePlannerItem(userId, plannerItemId)) {
        backupDeleteFromMongo(userId, plannerItemId)
        return true
      }
    } catch (error) {
      console.error('Neon delete planner item failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  const idx = mockStore.plannerItems.findIndex(
    (item) => item.id === plannerItemId && item.userId === userId,
  )
  if (idx === -1) return false
  mockStore.plannerItems.splice(idx, 1)
  return true
}

/** Best-effort index setup when Atlas is used for planner or as backup. */
export function warmMongoPlannerIndexes() {
  const mode = resolvePlannerStoreMode()
  if (mode !== 'atlas' && mode !== 'backup') return
  if (!isMongoEnabled()) return
  import('./mongo-planner.js')
    .then(({ ensureMongoPlannerIndexes }) => ensureMongoPlannerIndexes())
    .catch((error) => console.error('Mongo planner index setup failed (non-fatal):', error))
}

function isSchemaBootstrapError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('db:push') || message.includes('users table missing')
}

function publicMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  const msg = error.message

  if (msg.startsWith('Cannot connect to MongoDB') || msg.startsWith('MongoDB authentication failed')) {
    return msg
  }

  const mongoHint = mongoConnectErrorMessage(error)
  if (mongoHint !== msg) return mongoHint

  if (isMissingRelation(error, 'users') || msg.includes('users table missing')) {
    return 'Database not initialized — run npm run db:push against Neon, then redeploy'
  }
  if (isMissingRelation(error, 'planner_items')) {
    return 'Planner table missing in Neon — run npm run db:push'
  }
  return msg || fallback
}

export { publicMessage as plannerErrorMessage }
