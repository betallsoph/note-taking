import { timingSafeEqual } from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'

export interface AuthUser {
  id: string
  email: string
  name: string
}

declare module 'express-serve-static-core' {
  interface Request {
    user: AuthUser
  }
}

const MOCK_USER: AuthUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'learner@example.com',
  name: 'CS Learner',
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

export function requireAccessToken(req: Request, res: Response, next: NextFunction) {
  const expected = accessToken()
  if (!expected) return next()

  const provided = tokenFromRequest(req)
  if (provided && tokenMatches(provided, expected)) return next()

  return res.status(401).json({ error: 'Access token required' })
}

export function mockAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = MOCK_USER
  next()
}

export { MOCK_USER }
