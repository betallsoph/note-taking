import { randomUUID } from 'node:crypto'
import type { Collection, Document } from 'mongodb'
import type { PlannerHorizon, PlannerItem, PlannerScope, PlannerStatus } from '../mock-store.js'
import { getMongoDb, isMongoEnabled } from './mongo.js'

export const PLANNER_COLLECTION = 'planner_items'

export interface PlannerDocument {
  _id: string
  userId: string
  title: string
  content: Record<string, unknown>
  /** Denormalized plain text for search / regex fallback. */
  searchText: string
  scope: PlannerScope
  projectName: string | null
  horizon: PlannerHorizon
  status: PlannerStatus
  targetDate: Date | null
  createdAt: Date
  updatedAt: Date
}

const PLANNER_HORIZONS: PlannerHorizon[] = ['now', 'next', 'later', 'someday']
const PLANNER_STATUSES: PlannerStatus[] = ['open', 'doing', 'done', 'dropped']
const PLANNER_SCOPES: PlannerScope[] = ['personal', 'project']
const PLANNER_HORIZON_ORDER: Record<PlannerHorizon, number> = {
  now: 0,
  next: 1,
  later: 2,
  someday: 3,
}

export type PlannerListFilters = {
  status?: string
  horizon?: string
  scope?: string
  project?: string
  search?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function extractSearchText(content: unknown): string {
  const record = asRecord(content)
  if (typeof record.markdown === 'string') return record.markdown
  if (typeof record.body === 'string') return record.body
  return ''
}

function asPlannerHorizon(value: unknown): PlannerHorizon {
  return PLANNER_HORIZONS.includes(value as PlannerHorizon) ? (value as PlannerHorizon) : 'later'
}

function asPlannerStatus(value: unknown): PlannerStatus {
  return PLANNER_STATUSES.includes(value as PlannerStatus) ? (value as PlannerStatus) : 'open'
}

function asPlannerScope(value: unknown): PlannerScope {
  return PLANNER_SCOPES.includes(value as PlannerScope) ? (value as PlannerScope) : 'personal'
}

function optionalString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function optionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  return new Date(String(value))
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}

function nullableIso(value: Date | string | null) {
  return value ? toIso(value) : null
}

export function serializeMongoPlanner(doc: PlannerDocument): PlannerItem {
  return {
    id: doc._id,
    userId: doc.userId,
    title: doc.title,
    content: asRecord(doc.content),
    scope: asPlannerScope(doc.scope),
    projectName: doc.projectName,
    horizon: asPlannerHorizon(doc.horizon),
    status: asPlannerStatus(doc.status),
    targetDate: nullableIso(doc.targetDate),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  }
}

export async function plannerCollection(): Promise<Collection<PlannerDocument>> {
  const db = await getMongoDb()
  return db.collection<PlannerDocument>(PLANNER_COLLECTION)
}

export async function ensureMongoPlannerIndexes() {
  if (!isMongoEnabled()) return
  const col = await plannerCollection()
  await Promise.all([
    col.createIndex({ userId: 1, status: 1, updatedAt: -1 }),
    col.createIndex({ userId: 1, horizon: 1, updatedAt: -1 }),
    col.createIndex({ userId: 1, scope: 1, updatedAt: -1 }),
    col.createIndex({ userId: 1, projectName: 1 }),
  ])
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

function applyListFilters(items: PlannerItem[], filters: PlannerListFilters) {
  const query = filters.search?.toLowerCase()
  const project = filters.project?.toLowerCase()

  return sortPlannerItems(
    items.filter((item) => {
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

export async function listMongoPlannerItems(userId: string, filters: PlannerListFilters = {}) {
  const col = await plannerCollection()
  const filter: Document = { userId }
  if (filters.status) filter.status = filters.status
  if (filters.horizon) filter.horizon = filters.horizon
  if (filters.scope) filter.scope = filters.scope
  if (filters.project) filter.projectName = filters.project

  const query = filters.search?.trim()
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { searchText: { $regex: query, $options: 'i' } },
    ]
  }

  const rows = await col.find(filter).toArray()
  return applyListFilters(rows.map(serializeMongoPlanner), filters)
}

export async function getMongoPlannerItem(userId: string, plannerItemId: string) {
  const col = await plannerCollection()
  const doc = await col.findOne({ _id: plannerItemId, userId })
  return doc ? serializeMongoPlanner(doc) : null
}

export async function createMongoPlannerItem(userId: string, body: Record<string, unknown>) {
  const col = await plannerCollection()
  const now = new Date()
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) throw new Error('Title is required')

  const scope = asPlannerScope(body.scope)
  const projectName = optionalString(body.projectName)
  if (scope === 'project' && !projectName) {
    throw new Error('projectName is required when scope is project')
  }

  const content =
    body.content !== undefined
      ? asRecord(body.content)
      : typeof body.body === 'string' && body.body.trim()
        ? { markdown: body.body.trim() }
        : { markdown: '' }

  const doc: PlannerDocument = {
    _id: randomUUID(),
    userId,
    title,
    content,
    searchText: extractSearchText(content),
    scope,
    projectName: scope === 'project' ? projectName : null,
    horizon: asPlannerHorizon(body.horizon),
    status: asPlannerStatus(body.status),
    targetDate: optionalDate(body.targetDate) ?? null,
    createdAt: now,
    updatedAt: now,
  }
  await col.insertOne(doc)
  return serializeMongoPlanner(doc)
}

export async function updateMongoPlannerItem(
  userId: string,
  plannerItemId: string,
  body: Record<string, unknown>,
) {
  const col = await plannerCollection()
  const current = await col.findOne({ _id: plannerItemId, userId })
  if (!current) return null

  const updates: Partial<PlannerDocument> = { updatedAt: new Date() }
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if (body.content !== undefined) {
    updates.content = asRecord(body.content)
    updates.searchText = extractSearchText(body.content)
  } else if ('body' in body) {
    const content =
      typeof body.body === 'string' && body.body.trim()
        ? { markdown: body.body.trim() }
        : { markdown: '' }
    updates.content = content
    updates.searchText = extractSearchText(content)
  }
  if ('scope' in body) updates.scope = asPlannerScope(body.scope)
  if ('horizon' in body) updates.horizon = asPlannerHorizon(body.horizon)
  if ('status' in body) updates.status = asPlannerStatus(body.status)
  if ('projectName' in body) updates.projectName = optionalString(body.projectName)
  if ('targetDate' in body) updates.targetDate = optionalDate(body.targetDate) ?? null

  const scope = updates.scope ?? asPlannerScope(current.scope)
  const projectName =
    'projectName' in body ? optionalString(body.projectName) : current.projectName
  if (scope === 'project' && !projectName) {
    throw new Error('projectName is required when scope is project')
  }
  updates.projectName = scope === 'project' ? projectName : null

  const result = await col.findOneAndUpdate(
    { _id: plannerItemId, userId },
    { $set: updates },
    { returnDocument: 'after' },
  )
  if (!result) return null
  return serializeMongoPlanner(result)
}

export async function deleteMongoPlannerItem(userId: string, plannerItemId: string) {
  const col = await plannerCollection()
  const result = await col.deleteOne({ _id: plannerItemId, userId })
  return result.deletedCount > 0
}

/** Upsert a Neon planner item into Atlas (backup / migration). */
export async function upsertMongoPlannerItem(item: PlannerItem) {
  const col = await plannerCollection()
  const doc: PlannerDocument = {
    _id: item.id,
    userId: item.userId,
    title: item.title,
    content: asRecord(item.content),
    searchText: extractSearchText(item.content),
    scope: item.scope,
    projectName: item.projectName,
    horizon: item.horizon,
    status: item.status,
    targetDate: item.targetDate ? new Date(item.targetDate) : null,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }
  await col.replaceOne({ _id: item.id, userId: item.userId }, doc, { upsert: true })
}
