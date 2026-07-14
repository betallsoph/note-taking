import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apiRequest } from './client.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STORE_PATH = process.env.NNG_PENDING_PATH ?? join(__dirname, '..', '.pending-changes.json')

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type PendingChange = {
  id: string
  createdAt: string
  updatedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'
  summary: string
  resource: string
  action: string
  method: HttpMethod
  path: string
  body?: unknown
  result?: unknown
  error?: string
}

type StoreFile = {
  changes: PendingChange[]
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
  const store = ensureStore()
  return store.changes
    .filter((c) => (includeClosed ? true : c.status === 'pending'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getPending(id: string): PendingChange | undefined {
  return ensureStore().changes.find((c) => c.id === id)
}

export function createProposal(input: {
  summary: string
  resource: string
  action: string
  method: HttpMethod
  path: string
  body?: unknown
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
    method: input.method,
    path: input.path,
    body: input.body,
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
  if (current.status !== 'pending') {
    throw new Error(`Change ${id} is already ${current.status}`)
  }
  return updateChange(id, { status: 'rejected' })
}

export async function approveProposal(id: string): Promise<PendingChange> {
  const current = getPending(id)
  if (!current) throw new Error(`Pending change not found: ${id}`)
  if (current.status !== 'pending') {
    throw new Error(`Change ${id} is already ${current.status}`)
  }

  updateChange(id, { status: 'approved' })

  try {
    const result = await apiRequest(current.path, {
      method: current.method,
      body: current.body !== undefined ? JSON.stringify(current.body) : undefined,
    })
    return updateChange(id, { status: 'executed', result: result ?? { ok: true } })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return updateChange(id, { status: 'failed', error: message })
  }
}

export function formatProposal(change: PendingChange): string {
  return [
    '⚠️ MUTATION PROPOSAL — NOT EXECUTED YET',
    'You must get explicit user approval, then call approve_change / reject_change.',
    '',
    `id: ${change.id}`,
    `status: ${change.status}`,
    `resource: ${change.resource}`,
    `action: ${change.action}`,
    `summary: ${change.summary}`,
    `request: ${change.method} ${change.path}`,
    change.body !== undefined ? `body:\n${JSON.stringify(change.body, null, 2)}` : 'body: (none)',
    '',
    'Next steps for the assistant:',
    '1. Show this proposal clearly to the user.',
    '2. Wait for explicit approval ("ok", "approve", "làm đi", etc.).',
    `3. Call approve_change with proposal_id="${change.id}" OR reject_change to discard.`,
  ].join('\n')
}
