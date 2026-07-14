import {
  createNote,
  deleteNote,
  getNote,
  isDatabaseEnabled,
  listNotes,
  updateNote,
} from './repositories.js'
import {
  createMongoNote,
  deleteMongoNote,
  getMongoNote,
  listMongoNotes,
  updateMongoNote,
} from './mongo-notes.js'
import { isMongoEnabled } from './mongo.js'
import { mockStore, id, now, type Note } from '../mock-store.js'
import { isMissingRelation } from './pg-error.js'

export type NotesStore = 'atlas' | 'neon' | 'mock'

let mongoUsable: boolean | null = null
let mongoCheckedAt = 0
const MONGO_HEALTH_TTL_MS = 60_000

async function canUseMongo(): Promise<boolean> {
  if (!isMongoEnabled()) return false

  const fresh = mongoCheckedAt && Date.now() - mongoCheckedAt < MONGO_HEALTH_TTL_MS
  if (fresh && mongoUsable !== null) return mongoUsable

  try {
    const { getMongoDb } = await import('./mongo.js')
    const db = await getMongoDb()
    await db.command({ ping: 1 })
    mongoUsable = true
  } catch (error) {
    console.error('MongoDB unavailable for notes — falling back:', error)
    mongoUsable = false
  }
  mongoCheckedAt = Date.now()
  return mongoUsable
}

export function resetMongoHealthCache() {
  mongoUsable = null
  mongoCheckedAt = 0
}

export async function activeNotesStore(): Promise<NotesStore> {
  if (await canUseMongo()) return 'atlas'
  if (isDatabaseEnabled()) return 'neon'
  return 'mock'
}

function sortMockNotes(items: Note[]) {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

function filterMockNotes(
  userId: string,
  filters: { search?: string; pinned?: string },
) {
  let items = mockStore.notes.filter((n) => n.userId === userId)
  if (filters.pinned === 'true') items = items.filter((n) => n.isPinned)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    items = items.filter((n) => {
      const markdown =
        typeof n.content.markdown === 'string' ? n.content.markdown.toLowerCase() : ''
      return n.title.toLowerCase().includes(q) || markdown.includes(q)
    })
  }
  return sortMockNotes(items)
}

export async function listNotesAnywhere(
  userId: string,
  filters: { search?: string; pinned?: string } = {},
) {
  if (await canUseMongo()) {
    try {
      return await listMongoNotes(userId, filters)
    } catch (error) {
      console.error('Mongo list notes failed — falling back:', error)
      mongoUsable = false
    }
  }
  if (isDatabaseEnabled()) {
    try {
      return await listNotes(userId, filters)
    } catch (error) {
      console.error('Neon list notes failed — falling back to mock:', error)
    }
  }
  return filterMockNotes(userId, filters)
}

export async function getNoteAnywhere(userId: string, noteId: string) {
  if (await canUseMongo()) {
    try {
      const note = await getMongoNote(userId, noteId)
      if (note) return note
    } catch (error) {
      console.error('Mongo get note failed — falling back:', error)
      mongoUsable = false
    }
  }
  if (isDatabaseEnabled()) {
    try {
      const note = await getNote(userId, noteId)
      if (note) return note
    } catch (error) {
      console.error('Neon get note failed — falling back to mock:', error)
    }
  }
  return mockStore.notes.find((n) => n.id === noteId && n.userId === userId) ?? null
}

export async function createNoteAnywhere(userId: string, body: Record<string, unknown>) {
  const title =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled'
  const content = body.content ?? { markdown: '' }
  const isPinned = Boolean(body.isPinned)

  if (await canUseMongo()) {
    try {
      return await createMongoNote(userId, body)
    } catch (error) {
      console.error('Mongo create note failed — falling back:', error)
      mongoUsable = false
    }
  }

  if (isDatabaseEnabled()) {
    try {
      return await createNote(userId, body)
    } catch (error) {
      if (process.env.NODE_ENV === 'production') throw error
      if (isMissingRelation(error) || isSchemaBootstrapError(error)) {
        console.error('Neon notes unavailable — falling back to mock:', error)
      } else {
        throw error
      }
    }
  }

  const note: Note = {
    id: id(),
    userId,
    title,
    content: content as Record<string, unknown>,
    isPinned,
    createdAt: now(),
    updatedAt: now(),
  }
  mockStore.notes.unshift(note)
  return note
}

export async function updateNoteAnywhere(
  userId: string,
  noteId: string,
  body: Record<string, unknown>,
) {
  if (await canUseMongo()) {
    try {
      const note = await updateMongoNote(userId, noteId, body)
      if (note) return note
    } catch (error) {
      console.error('Mongo update note failed — falling back:', error)
      mongoUsable = false
    }
  }

  if (isDatabaseEnabled()) {
    try {
      const note = await updateNote(userId, noteId, body)
      if (note) return note
    } catch (error) {
      console.error('Neon update note failed — falling back to mock:', error)
    }
  }

  const idx = mockStore.notes.findIndex((n) => n.id === noteId && n.userId === userId)
  if (idx === -1) return null
  const current = mockStore.notes[idx]
  mockStore.notes[idx] = {
    ...current,
    title:
      typeof body.title === 'string' && body.title.trim()
        ? body.title.trim()
        : current.title,
    content: body.content !== undefined ? (body.content as Record<string, unknown>) : current.content,
    isPinned:
      typeof body.isPinned === 'boolean' ? body.isPinned : current.isPinned,
    updatedAt: now(),
  }
  return mockStore.notes[idx]
}

export async function deleteNoteAnywhere(userId: string, noteId: string) {
  if (await canUseMongo()) {
    try {
      if (await deleteMongoNote(userId, noteId)) return true
    } catch (error) {
      console.error('Mongo delete note failed — falling back:', error)
      mongoUsable = false
    }
  }

  if (isDatabaseEnabled()) {
    try {
      if (await deleteNote(userId, noteId)) return true
    } catch (error) {
      console.error('Neon delete note failed — falling back to mock:', error)
    }
  }

  const idx = mockStore.notes.findIndex((n) => n.id === noteId && n.userId === userId)
  if (idx === -1) return false
  mockStore.notes.splice(idx, 1)
  return true
}

export async function countNotesAnywhere(userId: string) {
  try {
    const notes = await listNotesAnywhere(userId)
    return notes.length
  } catch {
    return mockStore.notes.filter((n) => n.userId === userId).length
  }
}

/** Best-effort index setup — must not block API startup. */
export function warmMongoNotesIndexes() {
  if (!isMongoEnabled()) return
  import('./mongo-notes.js')
    .then(({ ensureMongoNotesIndexes }) => ensureMongoNotesIndexes())
    .catch((error) => console.error('Mongo index setup failed (non-fatal):', error))
}

function isSchemaBootstrapError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('db:push') || message.includes('users table missing')
}

function publicMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback
  const msg = error.message
  if (msg.includes('authentication failed') || msg.includes('bad auth')) {
    return 'MongoDB authentication failed — check MONGODB_URI password'
  }
  if (isMissingRelation(error, 'users') || msg.includes('users table missing')) {
    return 'Database not initialized — run npm run db:push against Neon, then redeploy'
  }
  if (isMissingRelation(error, 'notes')) {
    return 'Notes table missing in Neon — run npm run db:push'
  }
  return msg || fallback
}

export { publicMessage as notesErrorMessage }
