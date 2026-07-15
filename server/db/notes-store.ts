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
  upsertMongoNote,
} from './mongo-notes.js'
import { isMongoEnabled } from './mongo.js'
import {
  activeNotesStoreLabel,
  resolveNotesStoreMode,
  usesMongoNotesBackup,
  type NotesStoreLabel,
} from './notes-config.js'
import { mockStore, id, now, type Note } from '../mock-store.js'
import { isMissingRelation } from './pg-error.js'

export type NotesStore = NotesStoreLabel

function queueMongoBackup(task: () => Promise<void>) {
  task().catch((error) => console.error('Mongo notes backup failed (non-fatal):', error))
}

function backupNoteToMongo(note: Note) {
  if (!usesMongoNotesBackup()) return
  queueMongoBackup(() => upsertMongoNote(note).then(() => undefined))
}

function backupDeleteFromMongo(userId: string, noteId: string) {
  if (!usesMongoNotesBackup()) return
  queueMongoBackup(() => deleteMongoNote(userId, noteId).then(() => undefined))
}

export function activeNotesStore(): NotesStore {
  return activeNotesStoreLabel()
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

async function listFromNeon(
  userId: string,
  filters: { search?: string; pinned?: string },
) {
  if (!isDatabaseEnabled()) return null
  try {
    return await listNotes(userId, filters)
  } catch (error) {
    console.error('Neon list notes failed:', error)
    return null
  }
}

async function listFromAtlas(
  userId: string,
  filters: { search?: string; pinned?: string },
) {
  try {
    return await listMongoNotes(userId, filters)
  } catch (error) {
    console.error('Atlas list notes failed:', error)
    if (process.env.NODE_ENV === 'production') throw error
    return null
  }
}

export async function listNotesAnywhere(
  userId: string,
  filters: { search?: string; pinned?: string } = {},
) {
  const mode = resolveNotesStoreMode()

  if (mode === 'atlas') {
    const notes = await listFromAtlas(userId, filters)
    if (notes) return notes
    if (process.env.NODE_ENV === 'production') throw new Error('Atlas notes unavailable')
  }

  if (mode === 'neon' || mode === 'backup') {
    const notes = await listFromNeon(userId, filters)
    if (notes) return notes
    if (process.env.NODE_ENV === 'production') throw new Error('Neon notes unavailable')
  }

  return filterMockNotes(userId, filters)
}

export async function getNoteAnywhere(userId: string, noteId: string) {
  const mode = resolveNotesStoreMode()

  if (mode === 'atlas') {
    try {
      const note = await getMongoNote(userId, noteId)
      if (note) return note
    } catch (error) {
      console.error('Atlas get note failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  if (mode === 'neon' || mode === 'backup') {
    try {
      const note = await getNote(userId, noteId)
      if (note) return note
    } catch (error) {
      console.error('Neon get note failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  return mockStore.notes.find((n) => n.id === noteId && n.userId === userId) ?? null
}

export async function createNoteAnywhere(userId: string, body: Record<string, unknown>) {
  const title =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled'
  const content = body.content ?? { markdown: '' }
  const isPinned = Boolean(body.isPinned)
  const mode = resolveNotesStoreMode()

  if (mode === 'atlas') {
    try {
      return await createMongoNote(userId, body)
    } catch (error) {
      console.error('Atlas create note failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  if (mode === 'neon' || mode === 'backup') {
    try {
      const note = await createNote(userId, body)
      backupNoteToMongo(note)
      return note
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
  const mode = resolveNotesStoreMode()

  if (mode === 'atlas') {
    try {
      const note = await updateMongoNote(userId, noteId, body)
      if (note) return note
    } catch (error) {
      console.error('Atlas update note failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  if (mode === 'neon' || mode === 'backup') {
    try {
      const note = await updateNote(userId, noteId, body)
      if (note) {
        backupNoteToMongo(note)
        return note
      }
    } catch (error) {
      console.error('Neon update note failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
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
  const mode = resolveNotesStoreMode()

  if (mode === 'atlas') {
    try {
      if (await deleteMongoNote(userId, noteId)) return true
    } catch (error) {
      console.error('Atlas delete note failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  if (mode === 'neon' || mode === 'backup') {
    try {
      if (await deleteNote(userId, noteId)) {
        backupDeleteFromMongo(userId, noteId)
        return true
      }
    } catch (error) {
      console.error('Neon delete note failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  const idx = mockStore.notes.findIndex((n) => n.id === noteId && n.userId === userId)
  if (idx === -1) return false
  mockStore.notes.splice(idx, 1)
  return true
}

export async function countNotesAnywhere(userId: string) {
  const mode = resolveNotesStoreMode()

  if (mode === 'atlas') {
    try {
      const { countMongoNotes } = await import('./mongo-notes.js')
      return await countMongoNotes(userId)
    } catch (error) {
      console.error('Atlas count notes failed:', error)
      if (process.env.NODE_ENV === 'production') throw error
    }
  }

  try {
    const notes = await listNotesAnywhere(userId)
    return notes.length
  } catch {
    return mockStore.notes.filter((n) => n.userId === userId).length
  }
}

/** Best-effort index setup when Atlas is used for notes or as backup. */
export function warmMongoNotesIndexes() {
  const mode = resolveNotesStoreMode()
  if (mode !== 'atlas' && mode !== 'backup') return
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
