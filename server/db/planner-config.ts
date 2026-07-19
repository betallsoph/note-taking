import { isDatabaseEnabled } from './index.js'
import { isMongoEnabled } from './mongo.js'

/** Where Planner items are read/written. `backup` = Neon primary + async Mongo copy. */
export type PlannerStoreMode = 'neon' | 'atlas' | 'backup' | 'mock'

export type PlannerStoreLabel = 'neon' | 'atlas' | 'mock'

function parsePlannerStoreEnv(): string | null {
  const raw = process.env.PLANNER_STORE?.trim().toLowerCase()
  return raw || null
}

/** Resolved Planner routing — no network calls. */
export function resolvePlannerStoreMode(): PlannerStoreMode {
  const configured = parsePlannerStoreEnv()

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
export function activePlannerStoreLabel(): PlannerStoreLabel {
  const mode = resolvePlannerStoreMode()
  if (mode === 'atlas') return 'atlas'
  if (mode === 'neon' || mode === 'backup') return isDatabaseEnabled() ? 'neon' : 'mock'
  return 'mock'
}

export function usesMongoForPlannerReads() {
  return resolvePlannerStoreMode() === 'atlas'
}

export function usesMongoPlannerBackup() {
  return resolvePlannerStoreMode() === 'backup' && isMongoEnabled()
}
