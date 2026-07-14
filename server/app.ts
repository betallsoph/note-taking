import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import 'dotenv/config'
import { MOCK_USER, isAccessTokenRequired, mockAuth, requireAccessToken } from './middleware/auth.js'
import { mockStore } from './mock-store.js'
import { databaseMode } from './db/index.js'
import { ensureUser, getDashboardStats, isDatabaseEnabled } from './db/repositories.js'
import articlesRouter from './routes/articles.js'
import categoriesRouter from './routes/categories.js'
import tagsRouter from './routes/tags.js'
import problemsRouter from './routes/problems.js'
import flashcardsRouter from './routes/flashcards.js'
import roadmapsRouter from './routes/roadmaps.js'
import notesRouter from './routes/notes.js'
import remindersRouter from './routes/reminders.js'
import simulationsRouter from './routes/simulations.js'
import devAccountsRouter from './routes/dev-accounts.js'

const app = express()
const ready = isDatabaseEnabled() ? ensureUser(MOCK_USER) : Promise.resolve()

app.use(cors())
app.use(express.json())
app.use(async (_req, _res, next) => {
  try {
    await ready
    next()
  } catch (error) {
    next(error)
  }
})
app.use(mockAuth)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mode: databaseMode, accessTokenRequired: isAccessTokenRequired() })
})

app.use(requireAccessToken)
app.get('/api/auth/me', (req, res) => {
  res.json(req.user)
})

app.get('/api/dashboard', async (req, res) => {
  if (isDatabaseEnabled()) {
    return res.json(await getDashboardStats(req.user.id))
  }
  res.json(mockStore.getDashboardStats(req.user.id))
})

app.use('/api/articles', articlesRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/tags', tagsRouter)
app.use('/api/problems', problemsRouter)
app.use('/api/flashcards', flashcardsRouter)
app.use('/api/roadmaps', roadmapsRouter)
app.use('/api/notes', notesRouter)
app.use('/api/reminders', remindersRouter)
app.use('/api/simulations', simulationsRouter)
app.use('/api/dev-accounts', devAccountsRouter)

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
