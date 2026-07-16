import { Router } from 'express'
import { isDatabaseEnabled } from '../db/index.js'
import { loginUser, registerUser } from '../db/repositories.js'
import { mockStore } from '../mock-store.js'
import { signAccessToken } from '../lib/jwt.js'
import type { AuthUser } from '../auth-constants.js'

const router = Router()

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/

function parseCredentials(body: unknown) {
  if (!body || typeof body !== 'object') return null
  const username = typeof (body as { username?: unknown }).username === 'string'
    ? (body as { username: string }).username.trim()
    : ''
  const password = typeof (body as { password?: unknown }).password === 'string'
    ? (body as { password: string }).password
    : ''
  const name = typeof (body as { name?: unknown }).name === 'string'
    ? (body as { name: string }).name.trim()
    : ''

  if (!USERNAME_RE.test(username)) {
    return { error: 'Username must be 3–32 characters (letters, numbers, underscore)' as const }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' as const }
  }

  return { username, password, name: name || username }
}

async function issueToken(user: AuthUser) {
  if (!user.username) {
    throw new Error('User account is missing a username')
  }
  const token = await signAccessToken(user.id, user.username)
  return { token, user }
}

router.post('/register', async (req, res, next) => {
  try {
    const parsed = parseCredentials(req.body)
    if (!parsed) return res.status(400).json({ error: 'Invalid request body' })
    if ('error' in parsed) return res.status(400).json({ error: parsed.error })

    const user = isDatabaseEnabled()
      ? await registerUser(parsed)
      : await mockStore.registerUser(parsed)

    const payload = await issueToken(user)
    res.status(201).json(payload)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Username already taken') {
        return res.status(409).json({ error: error.message })
      }
      if (error.message.includes('JWT_SECRET')) {
        return res.status(503).json({ error: error.message })
      }
    }
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const parsed = parseCredentials(req.body)
    if (!parsed) return res.status(400).json({ error: 'Invalid request body' })
    if ('error' in parsed) return res.status(400).json({ error: parsed.error })

    const user = isDatabaseEnabled()
      ? await loginUser(parsed.username, parsed.password)
      : await mockStore.loginUser(parsed.username, parsed.password)

    if (!user) return res.status(401).json({ error: 'Invalid username or password' })

    const payload = await issueToken(user)
    res.json(payload)
  } catch (error) {
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      return res.status(503).json({ error: error.message })
    }
    next(error)
  }
})

export default router
