import 'dotenv/config'
import { ensureMongoNotesIndexes, notesCollection, serializeMongoNote } from '../db/mongo-notes.js'
import { isMongoEnabled, getMongoDbName, mongoMode } from '../db/mongo.js'

const MOCK_USER_ID = '00000000-0000-4000-8000-000000000001'

async function seed() {
  if (!isMongoEnabled()) {
    console.error('MONGODB_URI is required. Add it to .env first.')
    process.exit(1)
  }

  console.log(`Seeding Mongo notes (mode=${mongoMode}, db=${getMongoDbName()})...`)
  await ensureMongoNotesIndexes()

  const col = await notesCollection()
  const existing = await col.countDocuments({ userId: MOCK_USER_ID })
  if (existing > 0) {
    console.log(`Already have ${existing} note(s) for demo user — skipping insert.`)
    process.exit(0)
  }

  const now = new Date()
  const docs = [
    {
      _id: crypto.randomUUID(),
      userId: MOCK_USER_ID,
      title: 'Random thoughts',
      content: {
        markdown:
          'Capture anything here — meeting notes, ideas, grocery lists.\n\n- Keep it messy\n- Pin the useful ones',
      },
      markdownText:
        'Capture anything here — meeting notes, ideas, grocery lists.\n\n- Keep it messy\n- Pin the useful ones',
      isPinned: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: crypto.randomUUID(),
      userId: MOCK_USER_ID,
      title: 'Weekend reading list',
      content: {
        markdown:
          '1. Designing Data-Intensive Applications ch.3\n2. PostgreSQL MVCC deep dive\n3. MongoDB Atlas Search fuzzy notes',
      },
      markdownText:
        '1. Designing Data-Intensive Applications ch.3\n2. PostgreSQL MVCC deep dive\n3. MongoDB Atlas Search fuzzy notes',
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    },
  ]

  await col.insertMany(docs)
  console.log(
    'Inserted:',
    docs.map((d) => serializeMongoNote(d).title),
  )
  console.log('Done. Create the Atlas Search index from server/db/atlas/notes-search-index.json')
  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
