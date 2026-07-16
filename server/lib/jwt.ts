import { SignJWT, jwtVerify } from 'jose'

const ISSUER = 'cs-hub'
const AUDIENCE = 'cs-hub-app'
const EXPIRY = '30d'

function secretKey() {
  const secret =
    process.env.JWT_SECRET?.trim() ||
    process.env.AUTH_JWT_SECRET?.trim() ||
    (process.env.NODE_ENV === 'production' ? '' : 'dev-only-insecure-jwt-secret-change-me')
  if (!secret) {
    throw new Error('JWT_SECRET is required for username/password auth')
  }
  return new TextEncoder().encode(secret)
}

export function hasJwtSecret() {
  return Boolean(
    process.env.JWT_SECRET?.trim() ||
      process.env.AUTH_JWT_SECRET?.trim() ||
      process.env.NODE_ENV !== 'production',
  )
}

export async function signAccessToken(userId: string, username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secretKey())
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secretKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
  })

  const userId = payload.sub
  const username = typeof payload.username === 'string' ? payload.username : null
  if (!userId || !username) {
    throw new Error('Invalid token payload')
  }

  return { userId, username }
}
