import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import 'dotenv/config'
import { MOCK_USER, authenticate, isAccessTokenRequired } from './middleware/auth.js'
import { hasJwtSecret } from './lib/jwt.js'
import { mockStore } from './mock-store.js'
import { databaseMode } from './db/index.js'
import { mongoMode } from './db/mongo.js'
import { countNotesAnywhere, warmMongoNotesIndexes, activeNotesStore } from './db/notes-store.js'
import { resolveNotesStoreMode, usesMongoNotesBackup } from './db/notes-config.js'
import { ensureUser, getDashboardStats, isDatabaseEnabled } from './db/repositories.js'
import articlesRouter from './routes/articles.js'
import categoriesRouter from './routes/categories.js'
import tagsRouter from './routes/tags.js'
import problemsRouter from './routes/problems.js'
import flashcardsRouter from './routes/flashcards.js'
import roadmapsRouter from './routes/roadmaps.js'
import notesRouter from './routes/notes.js'
import remindersRouter from './routes/reminders.js'
import plannerRouter from './routes/planner.js'
import accountsRouter from './routes/accounts.js'
import simulationsRouter from './routes/simulations.js'
import devAccountsRouter from './routes/dev-accounts.js'
import authRouter from './routes/auth.js'

const app = express()

if (isDatabaseEnabled()) {
  ensureUser(MOCK_USER).catch((error) => {
    console.error('Mock user bootstrap failed (non-fatal):', error)
  })
}

warmMongoNotesIndexes()

app.use(cors())
app.use(express.json())
app.use(authenticate)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: databaseMode,
    mongo: mongoMode,
    notesStore: activeNotesStore(),
    notesStoreMode: resolveNotesStoreMode(),
    mongoNotesBackup: usesMongoNotesBackup(),
    accessTokenRequired: isAccessTokenRequired(),
    jwtConfigured: hasJwtSecret(),
  })
})

app.use('/api/auth', authRouter)
app.get('/api/auth/me', (req, res) => {
  res.json(req.user)
})

app.get('/api/dashboard', async (req, res, next) => {
  try {
    if (isDatabaseEnabled()) {
      const stats = await getDashboardStats(req.user.id)
      stats.totalNotes = await countNotesAnywhere(req.user.id)
      return res.json(stats)
    }

    const stats = mockStore.getDashboardStats(req.user.id)
    stats.totalNotes = await countNotesAnywhere(req.user.id)
    res.json(stats)
  } catch (error) {
    next(error)
  }
})

app.use('/api/articles', articlesRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/tags', tagsRouter)
app.use('/api/problems', problemsRouter)
app.use('/api/flashcards', flashcardsRouter)
app.use('/api/roadmaps', roadmapsRouter)
app.use('/api/notes', notesRouter)
app.use('/api/reminders', remindersRouter)
app.use('/api/planner', plannerRouter)
app.use('/api/accounts', accountsRouter)
app.use('/api/simulations', simulationsRouter)
app.use('/api/dev-accounts', devAccountsRouter)

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  let message = error instanceof Error ? error.message : 'Internal server error'
  if (message.startsWith('Failed query:')) {
    const cause = (error as { cause?: Error }).cause
    if (cause?.message) message = cause.message
    else if (message.includes('users')) message = 'Database not initialized — run npm run db:push against Neon'
  }
  res.status(500).json({ error: message })
})

export default app
