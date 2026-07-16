import { timingSafeEqual } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt.js'
import { getUserById } from '../db/repositories.js'
import { isDatabaseEnabled } from '../db/index.js'
import { MOCK_USER, type AuthUser } from '../auth-constants.js'

declare module 'express-serve-static-core' {
  interface Request {
    user: AuthUser
  }
}

function accessToken() {
  return process.env.APP_ACCESS_TOKEN?.trim() || null
}

function tokenFromRequest(req: Request) {
  const authHeader = req.get('authorization')
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice('Bearer '.length).trim()
  return req.get('x-app-access-token')?.trim() ?? null
}

function tokenMatches(input: string, expected: string) {
  const inputBuffer = Buffer.from(input)
  const expectedBuffer = Buffer.from(expected)
  return inputBuffer.length === expectedBuffer.length && timingSafeEqual(inputBuffer, expectedBuffer)
}

export function isAccessTokenRequired() {
  return Boolean(accessToken())
}

function isPublicPath(req: Request) {
  if (req.path === '/api/health') return true
  if (req.method !== 'POST') return false
  return req.path === '/api/auth/register' || req.path === '/api/auth/login'
}

async function resolveUserFromJwt(token: string): Promise<AuthUser | null> {
  try {
    const { userId } = await verifyAccessToken(token)
    if (isDatabaseEnabled()) {
      const user = await getUserById(userId)
      return user
    }
    const { mockStore } = await import('../mock-store.js')
    return mockStore.getAuthUserById(userId)
  } catch {
    return null
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  if (isPublicPath(req)) return next()

  const provided = tokenFromRequest(req)
  if (provided) {
    const jwtUser = await resolveUserFromJwt(provided)
    if (jwtUser) {
      req.user = jwtUser
      return next()
    }

    const legacy = accessToken()
    if (legacy && tokenMatches(provided, legacy)) {
      req.user = MOCK_USER
      return next()
    }
  }

  return res.status(401).json({ error: 'Authentication required' })
}

export { MOCK_USER, type AuthUser }
