import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { mockAuth } from './middleware/auth.js'
import { mockStore } from './mock-store.js'
import articlesRouter from './routes/articles.js'
import categoriesRouter from './routes/categories.js'
import tagsRouter from './routes/tags.js'
import problemsRouter from './routes/problems.js'
import flashcardsRouter from './routes/flashcards.js'
import roadmapsRouter from './routes/roadmaps.js'
import simulationsRouter from './routes/simulations.js'
import devAccountsRouter from './routes/dev-accounts.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())
app.use(mockAuth)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'mock' })
})

app.get('/api/auth/me', (req, res) => {
  res.json(req.user)
})

app.get('/api/dashboard', (req, res) => {
  res.json(mockStore.getDashboardStats(req.user.id))
})

app.use('/api/articles', articlesRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/tags', tagsRouter)
app.use('/api/problems', problemsRouter)
app.use('/api/flashcards', flashcardsRouter)
app.use('/api/roadmaps', roadmapsRouter)
app.use('/api/simulations', simulationsRouter)
app.use('/api/dev-accounts', devAccountsRouter)

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
