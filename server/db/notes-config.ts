import { isDatabaseEnabled } from './index.js'
import { isMongoEnabled } from './mongo.js'

/** Where Notes are read/written. `backup` = Neon primary + async Mongo copy. */
export type NotesStoreMode = 'neon' | 'atlas' | 'backup' | 'mock'

export type NotesStoreLabel = 'neon' | 'atlas' | 'mock'

function parseNotesStoreEnv(): string | null {
  const raw = process.env.NOTES_STORE?.trim().toLowerCase()
  return raw || null
}

/** Resolved Notes routing — no network calls. */
export function resolveNotesStoreMode(): NotesStoreMode {
  const configured = parseNotesStoreEnv()

  if (configured === 'atlas' || configured === 'mongo') {
    if (isMongoEnabled()) return 'atlas'
    return isDatabaseEnabled() ? 'neon' : 'mock'
  }

  if (configured === 'backup') {
    if (isDatabaseEnabled()) return 'backup'
    if (isMongoEnabled()) return 'atlas'
    return 'mock'
  }

  if (configured === 'neon' || configured === 'postgres') {
    return isDatabaseEnabled() ? 'neon' : 'mock'
  }

  // Default: Atlas when MONGODB_URI is set; else Neon; else mock. No runtime probing.
  if (isMongoEnabled()) return 'atlas'
  if (isDatabaseEnabled()) return 'neon'
  return 'mock'
}

/** Label shown in /api/health (`backup` reports as `neon`). */
export function activeNotesStoreLabel(): NotesStoreLabel {
  const mode = resolveNotesStoreMode()
  if (mode === 'atlas') return 'atlas'
  if (mode === 'neon' || mode === 'backup') return isDatabaseEnabled() ? 'neon' : 'mock'
  return 'mock'
}

export function usesMongoForNotesReads() {
  return resolveNotesStoreMode() === 'atlas'
}

export function usesMongoNotesBackup() {
  return resolveNotesStoreMode() === 'backup' && isMongoEnabled()
}
