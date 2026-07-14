import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MOCK_USER } from '../../../server/middleware/auth.js'
import {
  addMistake,
  addRoadmapItem,
  addSolution,
  archiveArticle,
  createArticle,
  createCategory,
  createDevAccount,
  createDevProject,
  createFlashcard,
  createProblem,
  createRoadmap,
  createTag,
  deleteArticle,
  deleteCategory,
  deleteDevAccount,
  deleteDevProject,
  deleteFlashcard,
  deleteProblem,
  deleteRoadmap,
  deleteRoadmapItem,
  deleteTag,
  duplicateArticle,
  ensureUser,
  reviewFlashcard,
  updateArticle,
  updateCategory,
  updateDevAccount,
  updateDevProject,
  updateFlashcard,
  updateProblem,
  updateRoadmap,
  updateRoadmapItem,
} from '../../../server/db/repositories.js'
import type { ReviewRating } from '../../../server/mock-store.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STORE_PATH = process.env.NNG_PENDING_PATH ?? join(__dirname, '..', '.pending-changes.json')
const userId = MOCK_USER.id

export type MutationOp =
  | { type: 'create_article'; body: Record<string, unknown> }
  | { type: 'update_article'; id: string; body: Record<string, unknown> }
  | { type: 'delete_article'; id: string }
  | { type: 'duplicate_article'; id: string }
  | { type: 'archive_article'; id: string }
  | { type: 'create_category'; body: Record<string, unknown> }
  | { type: 'update_category'; id: string; body: Record<string, unknown> }
  | { type: 'delete_category'; id: string }
  | { type: 'create_tag'; body: Record<string, unknown> }
  | { type: 'delete_tag'; id: string }
  | { type: 'create_problem'; body: Record<string, unknown> }
  | { type: 'update_problem'; id: string; body: Record<string, unknown> }
  | { type: 'delete_problem'; id: string }
  | { type: 'add_solution'; problemId: string; body: Record<string, unknown> }
  | { type: 'add_mistake'; problemId: string; body: Record<string, unknown> }
  | { type: 'create_flashcard'; body: Record<string, unknown> }
  | { type: 'update_flashcard'; id: string; body: Record<string, unknown> }
  | { type: 'delete_flashcard'; id: string }
  | { type: 'review_flashcard'; id: string; rating: ReviewRating }
  | { type: 'create_roadmap'; body: Record<string, unknown> }
  | { type: 'update_roadmap'; id: string; body: Record<string, unknown> }
  | { type: 'delete_roadmap'; id: string }
  | { type: 'add_roadmap_item'; roadmapId: string; body: Record<string, unknown> }
  | { type: 'update_roadmap_item'; roadmapId: string; itemId: string; body: Record<string, unknown> }
  | { type: 'delete_roadmap_item'; roadmapId: string; itemId: string }
  | { type: 'create_dev_project'; body: Record<string, unknown> }
  | { type: 'update_dev_project'; id: string; body: Record<string, unknown> }
  | { type: 'delete_dev_project'; id: string }
  | { type: 'create_dev_account'; projectId: string; body: Record<string, unknown> }
  | { type: 'update_dev_account'; projectId: string; accountId: string; body: Record<string, unknown> }
  | { type: 'delete_dev_account'; projectId: string; accountId: string }

export type PendingChange = {
  id: string
  createdAt: string
  updatedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'
  summary: string
  resource: string
  action: string
  op: MutationOp
  result?: unknown
  error?: string
}

type StoreFile = { changes: PendingChange[] }

let databaseUserReady: Promise<boolean> | undefined

export function ensureDatabaseUser() {
  databaseUserReady ??= ensureUser(MOCK_USER)
  return databaseUserReady
}

function ensureStore(): StoreFile {
  const dir = dirname(STORE_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  if (!existsSync(STORE_PATH)) {
    const empty: StoreFile = { changes: [] }
    writeFileSync(STORE_PATH, JSON.stringify(empty, null, 2))
    return empty
  }
  return JSON.parse(readFileSync(STORE_PATH, 'utf8')) as StoreFile
}

function saveStore(store: StoreFile) {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
}

export function listPending(includeClosed = false): PendingChange[] {
  return ensureStore()
    .changes.filter((c) => (includeClosed ? true : c.status === 'pending'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getPending(id: string): PendingChange | undefined {
  return ensureStore().changes.find((c) => c.id === id)
}

export function createProposal(input: {
  summary: string
  resource: string
  action: string
  op: MutationOp
}): PendingChange {
  const store = ensureStore()
  const now = new Date().toISOString()
  const change: PendingChange = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'pending',
    summary: input.summary,
    resource: input.resource,
    action: input.action,
    op: input.op,
  }
  store.changes.unshift(change)
  saveStore(store)
  return change
}

function updateChange(id: string, patch: Partial<PendingChange>): PendingChange {
  const store = ensureStore()
  const idx = store.changes.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error(`Pending change not found: ${id}`)
  store.changes[idx] = {
    ...store.changes[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  saveStore(store)
  return store.changes[idx]
}

export function rejectProposal(id: string): PendingChange {
  const current = getPending(id)
  if (!current) throw new Error(`Pending change not found: ${id}`)
  if (current.status !== 'pending') throw new Error(`Change ${id} is already ${current.status}`)
  return updateChange(id, { status: 'rejected' })
}

async function executeOp(op: MutationOp): Promise<unknown> {
  await ensureDatabaseUser()

  switch (op.type) {
    case 'create_article':
      return createArticle(userId, op.body)
    case 'update_article': {
      const row = await updateArticle(userId, op.id, op.body)
      if (!row) throw new Error(`Article ${op.id} not found`)
      return row
    }
    case 'delete_article': {
      const ok = await deleteArticle(userId, op.id)
      if (!ok) throw new Error(`Article ${op.id} not found`)
      return { deleted: true, id: op.id }
    }
    case 'duplicate_article': {
      const row = await duplicateArticle(userId, op.id)
      if (!row) throw new Error(`Article ${op.id} not found`)
      return row
    }
    case 'archive_article': {
      const row = await archiveArticle(userId, op.id)
      if (!row) throw new Error(`Article ${op.id} not found`)
      return row
    }
    case 'create_category':
      return createCategory(userId, {
        name: String(op.body.name),
        description: (op.body.description as string | null | undefined) ?? null,
        icon: (op.body.icon as string | null | undefined) ?? null,
        color: (op.body.color as string | null | undefined) ?? null,
      })
    case 'update_category': {
      const row = await updateCategory(userId, op.id, op.body)
      if (!row) throw new Error(`Category ${op.id} not found`)
      return row
    }
    case 'delete_category': {
      const ok = await deleteCategory(userId, op.id)
      if (!ok) throw new Error(`Category ${op.id} not found`)
      return { deleted: true, id: op.id }
    }
    case 'create_tag':
      return createTag(userId, {
        name: String(op.body.name),
        color: (op.body.color as string | null | undefined) ?? null,
      })
    case 'delete_tag': {
      const ok = await deleteTag(userId, op.id)
      if (!ok) throw new Error(`Tag ${op.id} not found`)
      return { deleted: true, id: op.id }
    }
    case 'create_problem':
      return createProblem(userId, op.body)
    case 'update_problem': {
      const row = await updateProblem(userId, op.id, op.body)
      if (!row) throw new Error(`Problem ${op.id} not found`)
      return row
    }
    case 'delete_problem': {
      const ok = await deleteProblem(userId, op.id)
      if (!ok) throw new Error(`Problem ${op.id} not found`)
      return { deleted: true, id: op.id }
    }
    case 'add_solution': {
      const row = await addSolution(userId, op.problemId, op.body)
      if (!row) throw new Error(`Problem ${op.problemId} not found`)
      return row
    }
    case 'add_mistake': {
      const row = await addMistake(userId, op.problemId, op.body)
      if (!row) throw new Error(`Problem ${op.problemId} not found`)
      return row
    }
    case 'create_flashcard':
      return createFlashcard(userId, op.body)
    case 'update_flashcard': {
      const row = await updateFlashcard(userId, op.id, op.body)
      if (!row) throw new Error(`Flashcard ${op.id} not found`)
      return row
    }
    case 'delete_flashcard': {
      const ok = await deleteFlashcard(userId, op.id)
      if (!ok) throw new Error(`Flashcard ${op.id} not found`)
      return { deleted: true, id: op.id }
    }
    case 'review_flashcard': {
      const row = await reviewFlashcard(userId, op.id, op.rating)
      if (!row) throw new Error(`Flashcard ${op.id} not found`)
      return row
    }
    case 'create_roadmap':
      return createRoadmap(userId, op.body)
    case 'update_roadmap': {
      const row = await updateRoadmap(userId, op.id, op.body)
      if (!row) throw new Error(`Roadmap ${op.id} not found`)
      return row
    }
    case 'delete_roadmap': {
      const ok = await deleteRoadmap(userId, op.id)
      if (!ok) throw new Error(`Roadmap ${op.id} not found`)
      return { deleted: true, id: op.id }
    }
    case 'add_roadmap_item': {
      const row = await addRoadmapItem(userId, op.roadmapId, op.body)
      if (!row) throw new Error(`Roadmap ${op.roadmapId} not found`)
      return row
    }
    case 'update_roadmap_item': {
      const row = await updateRoadmapItem(userId, op.roadmapId, op.itemId, op.body)
      if (!row) throw new Error(`Roadmap item ${op.itemId} not found`)
      return row
    }
    case 'delete_roadmap_item': {
      const ok = await deleteRoadmapItem(userId, op.roadmapId, op.itemId)
      if (!ok) throw new Error(`Roadmap item ${op.itemId} not found`)
      return { deleted: true, id: op.itemId }
    }
    case 'create_dev_project':
      return createDevProject(userId, op.body)
    case 'update_dev_project': {
      const row = await updateDevProject(userId, op.id, op.body)
      if (!row) throw new Error(`Dev project ${op.id} not found`)
      return row
    }
    case 'delete_dev_project': {
      const ok = await deleteDevProject(userId, op.id)
      if (!ok) throw new Error(`Dev project ${op.id} not found`)
      return { deleted: true, id: op.id }
    }
    case 'create_dev_account': {
      const row = await createDevAccount(userId, op.projectId, op.body)
      if (!row) throw new Error(`Dev project ${op.projectId} not found`)
      return row
    }
    case 'update_dev_account': {
      const row = await updateDevAccount(userId, op.projectId, op.accountId, op.body)
      if (!row) throw new Error(`Dev account ${op.accountId} not found`)
      return row
    }
    case 'delete_dev_account': {
      const ok = await deleteDevAccount(userId, op.projectId, op.accountId)
      if (!ok) throw new Error(`Dev account ${op.accountId} not found`)
      return { deleted: true, id: op.accountId }
    }
    default: {
      const _exhaustive: never = op
      throw new Error(`Unknown op: ${JSON.stringify(_exhaustive)}`)
    }
  }
}

export async function approveProposal(id: string): Promise<PendingChange> {
  const current = getPending(id)
  if (!current) throw new Error(`Pending change not found: ${id}`)
  if (current.status !== 'pending') throw new Error(`Change ${id} is already ${current.status}`)

  updateChange(id, { status: 'approved' })
  try {
    const result = await executeOp(current.op)
    return updateChange(id, { status: 'executed', result })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return updateChange(id, { status: 'failed', error: message })
  }
}

export function formatProposal(change: PendingChange): string {
  return [
    '⚠️ MUTATION PROPOSAL — NOT EXECUTED YET',
    'Show this to the user and WAIT for explicit approval before calling approve_change.',
    '',
    `id: ${change.id}`,
    `status: ${change.status}`,
    `resource: ${change.resource}`,
    `action: ${change.action}`,
    `summary: ${change.summary}`,
    `op:\n${JSON.stringify(change.op, null, 2)}`,
    '',
    'Next steps:',
    '1. Present the proposal clearly.',
    '2. Wait for explicit user approval (ok / approve / làm đi / ...).',
    `3. Call approve_change({ proposal_id: "${change.id}" }) or reject_change to discard.`,
  ].join('\n')
}
