import { sql } from 'drizzle-orm'
import { db } from './index.js'

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
}
