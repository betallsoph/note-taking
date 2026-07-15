import { MongoClient, type Db } from 'mongodb'

const uri = process.env.MONGODB_URI?.trim()
const dbName = process.env.MONGODB_DB_NAME?.trim() || 'cs_hub'

declare global {
  // Cached across warm Vercel serverless invocations.
  var __csHubMongoClientPromise: Promise<MongoClient> | undefined
}

/** True when Atlas / Mongo connection string is configured. */
export function isMongoEnabled() {
  return Boolean(uri)
}

export const mongoMode = uri ? 'atlas' : 'off'

export function mongoConnectErrorMessage(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error)
  const lower = msg.toLowerCase()

  if (
    lower.includes('ssl') ||
    lower.includes('tls') ||
    lower.includes('alert number') ||
    lower.includes('certificate') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('server selection') ||
    lower.includes('timed out') ||
    lower.includes('timeout')
  ) {
    return (
      'Cannot connect to MongoDB Atlas (SSL/network). ' +
      'In Atlas → Network Access, allow 0.0.0.0/0 (Vercel IPs change). ' +
      'Also check MONGODB_URI password is URL-encoded.'
    )
  }

  if (lower.includes('authentication failed') || lower.includes('bad auth') || lower.includes('auth failed')) {
    return 'MongoDB authentication failed — reset DB user password in Atlas and update MONGODB_URI (URL-encode special chars)'
  }

  return msg
}

async function getClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('MONGODB_URI is not configured')
  }

  if (!globalThis.__csHubMongoClientPromise) {
    const client = new MongoClient(uri, {
      // Keep the pool small for Vercel serverless.
      maxPoolSize: 5,
      minPoolSize: 0,
      // Fail faster so the UI does not hang ~8s on bad Atlas config.
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 5_000,
    })
    globalThis.__csHubMongoClientPromise = client.connect().catch((error) => {
      globalThis.__csHubMongoClientPromise = undefined
      const wrapped = new Error(mongoConnectErrorMessage(error))
      ;(wrapped as { cause?: unknown }).cause = error
      throw wrapped
    })
  }

  return globalThis.__csHubMongoClientPromise
}

export async function getMongoDb(): Promise<Db> {
  const client = await getClient()
  return client.db(dbName)
}

export function getMongoDbName() {
  return dbName
}
