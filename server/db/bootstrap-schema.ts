import { sql } from 'drizzle-orm'
import { db } from './index.js'
import { resolvePlannerStoreMode } from './planner-config.js'

/**
 * Planner primary store is Atlas — Neon rows are stale leftovers.
 * Safe to wipe whenever reads/writes go through Mongo.
 */
export async function clearNeonPlannerIfAtlasPrimary(): Promise<number> {
  if (!db) return 0
  if (resolvePlannerStoreMode() !== 'atlas') return 0

  try {
    const rows = await db.execute(sql`DELETE FROM planner_items RETURNING id`)
    const count = Array.isArray(rows) ? rows.length : Number((rows as { count?: number }).count ?? 0)
    if (count > 0) {
      console.log(`Cleared ${count} stale planner row(s) from Neon (Atlas is primary)`)
    }
    return count
  } catch (error) {
    console.error('Neon planner cleanup failed (non-fatal):', error)
    return 0
  }
}

/**
 * Ensures auth columns exist on Neon. Build-time db:push can be skipped when
 * DATABASE_URL is not available during Vercel builds.
 */
export async function bootstrapAuthSchema(): Promise<void> {
  if (!db) return

  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username text`)
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text`)
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `)
  } catch (error) {
    console.error('Auth schema bootstrap failed (non-fatal):', error)
  }

  try {
    await db.execute(sql`ALTER TABLE planner_items ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb`)
    await db.execute(sql`
      UPDATE planner_items
      SET content = jsonb_build_object('markdown', body)
      WHERE body IS NOT NULL
        AND btrim(body) <> ''
        AND content = '{}'::jsonb
    `)
  } catch (error) {
    console.error('Planner schema bootstrap failed (non-fatal):', error)
  }
}
