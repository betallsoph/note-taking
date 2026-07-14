import { randomUUID } from 'node:crypto'
import type { Collection, Document } from 'mongodb'
import type { Note } from '../mock-store.js'
import { getMongoDb, isMongoEnabled } from './mongo.js'

export const NOTES_COLLECTION = 'notes'
/** Atlas Search index name — create this in Atlas UI from atlas/notes-search-index.json */
export const NOTES_SEARCH_INDEX = 'notes_search'

export interface NoteDocument {
  _id: string
  userId: string
  title: string
  content: Record<string, unknown>
  /** Denormalized plain markdown for Atlas Search / regex fallback. */
  markdownText: string
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function extractMarkdown(content: unknown): string {
  const record = asRecord(content)
  if (typeof record.markdown === 'string') return record.markdown
  if (typeof record.body === 'string') return record.body
  return ''
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}

export function serializeMongoNote(doc: NoteDocument): Note {
  return {
    id: doc._id,
    userId: doc.userId,
    title: doc.title,
    content: asRecord(doc.content),
    isPinned: doc.isPinned,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  }
}

export async function notesCollection(): Promise<Collection<NoteDocument>> {
  const db = await getMongoDb()
  return db.collection<NoteDocument>(NOTES_COLLECTION)
}

/** Create regular indexes (Search index is created in Atlas UI). */
export async function ensureMongoNotesIndexes() {
  if (!isMongoEnabled()) return
  const col = await notesCollection()
  await Promise.all([
    col.createIndex({ userId: 1, updatedAt: -1 }),
    col.createIndex({ userId: 1, isPinned: -1, updatedAt: -1 }),
  ])
}

function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

async function regexSearch(
  col: Collection<NoteDocument>,
  userId: string,
  query: string,
  pinned?: string,
) {
  const filter: Document = { userId }
  if (pinned === 'true') filter.isPinned = true
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { markdownText: { $regex: query, $options: 'i' } },
    ]
  }
  const rows = await col.find(filter).sort({ updatedAt: -1 }).toArray()
  return sortNotes(rows.map(serializeMongoNote))
}

/**
 * Prefer Atlas Search ($search) when an index exists; fall back to regex
 * so local/dev still works before the Search index is created.
 */
export async function listMongoNotes(
  userId: string,
  filters: { search?: string; pinned?: string } = {},
) {
  const col = await notesCollection()
  const query = filters.search?.trim()

  if (!query) {
    return regexSearch(col, userId, '', filters.pinned)
  }

  try {
    const pipeline: Document[] = [
      {
        $search: {
          index: NOTES_SEARCH_INDEX,
          compound: {
            must: [
              {
                equals: {
                  path: 'userId',
                  value: userId,
                },
              },
            ],
            should: [
              {
                autocomplete: {
                  query,
                  path: 'title',
                  fuzzy: { maxEdits: 1 },
                },
              },
              {
                text: {
                  query,
                  path: ['title', 'markdownText'],
                  fuzzy: { maxEdits: 1 },
                },
              },
            ],
            minimumShouldMatch: 1,
          },
        },
      },
    ]

    if (filters.pinned === 'true') {
      pipeline.push({ $match: { isPinned: true } })
    }

    pipeline.push({ $limit: 50 })

    const rows = await col.aggregate<NoteDocument>(pipeline).toArray()
    return sortNotes(rows.map(serializeMongoNote))
  } catch {
    // Index missing / Search not enabled yet → regex fallback.
    return regexSearch(col, userId, query, filters.pinned)
  }
}

export async function countMongoNotes(userId: string) {
  const col = await notesCollection()
  return col.countDocuments({ userId })
}

export async function getMongoNote(userId: string, noteId: string) {
  const col = await notesCollection()
  const doc = await col.findOne({ _id: noteId, userId })
  return doc ? serializeMongoNote(doc) : null
}

export async function createMongoNote(userId: string, body: Record<string, unknown>) {
  const col = await notesCollection()
  const now = new Date()
  const title =
    typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled'
  const content = body.content ?? { markdown: '' }
  const doc: NoteDocument = {
    _id: randomUUID(),
    userId,
    title,
    content: asRecord(content),
    markdownText: extractMarkdown(content),
    isPinned: Boolean(body.isPinned),
    createdAt: now,
    updatedAt: now,
  }
  await col.insertOne(doc)
  return serializeMongoNote(doc)
}

export async function updateMongoNote(
  userId: string,
  noteId: string,
  body: Record<string, unknown>,
) {
  const col = await notesCollection()
  const current = await col.findOne({ _id: noteId, userId })
  if (!current) return null

  const updates: Partial<NoteDocument> = { updatedAt: new Date() }
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if (body.content !== undefined) {
    updates.content = asRecord(body.content)
    updates.markdownText = extractMarkdown(body.content)
  }
  if (typeof body.isPinned === 'boolean') updates.isPinned = body.isPinned

  const result = await col.findOneAndUpdate(
    { _id: noteId, userId },
    { $set: updates },
    { returnDocument: 'after' },
  )
  return result ? serializeMongoNote(result) : null
}

export async function deleteMongoNote(userId: string, noteId: string) {
  const col = await notesCollection()
  const result = await col.deleteOne({ _id: noteId, userId })
  return result.deletedCount > 0
}
