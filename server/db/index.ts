import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('DATABASE_URL not set — API will use in-memory mock data')
}

const client = connectionString ? postgres(connectionString, { prepare: false }) : null

export const db = client ? drizzle(client, { schema }) : null
export const databaseMode = db ? 'neon' : 'mock'

export type Database = NonNullable<typeof db>
