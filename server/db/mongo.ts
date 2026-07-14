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

async function getClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('MONGODB_URI is not configured')
  }

  if (!globalThis.__csHubMongoClientPromise) {
    const client = new MongoClient(uri, {
      // Keep the pool small for Vercel serverless.
      maxPoolSize: 5,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 8_000,
      connectTimeoutMS: 8_000,
    })
    globalThis.__csHubMongoClientPromise = client.connect().catch((error) => {
      globalThis.__csHubMongoClientPromise = undefined
      throw error
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
