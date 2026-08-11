import jwt from 'jsonwebtoken'
import { config } from '../config.js'

/**
 * Verify a Supabase access token locally (HS256, no network call) and return
 * the user id (`sub` claim). Throws if the token is missing or invalid.
 *
 * Note: this assumes the project signs tokens with the shared JWT secret
 * (SUPABASE_JWT_SECRET). Projects using asymmetric signing keys would verify
 * against the JWKS endpoint instead.
 */
export function verifyToken(token: string | undefined | null): string {
  if (!token) throw new Error('Missing token')
  const payload = jwt.verify(token, config.supabaseJwtSecret) as jwt.JwtPayload
  const userId = payload.sub
  if (!userId || typeof userId !== 'string') throw new Error('Invalid token: no subject')
  return userId
}

/** Extract a bearer token from an Authorization header value. */
export function bearerToken(header: string | undefined): string | null {
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1] : null
}
