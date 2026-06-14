import type { Request, Response, NextFunction } from 'express'

export interface AuthUser {
  id: string
  email: string
  name: string
}

declare global {
  namespace Express {
    interface Request {
      user: AuthUser
    }
  }
}

const MOCK_USER: AuthUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'learner@example.com',
  name: 'CS Learner',
}

export function mockAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = MOCK_USER
  next()
}

export { MOCK_USER }
