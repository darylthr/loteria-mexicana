import { supabaseAdmin } from '../lib/supabase.js'

/**
 * Verify a Supabase access token by resolving it against the Supabase Auth
 * server. This works regardless of the project's JWT signing scheme — the
 * legacy shared HS256 secret OR the newer asymmetric signing keys (ES256) —
 * so there's no secret to configure and no algorithm mismatch to debug.
 * Returns the authenticated user's id. Throws if the token is missing/invalid.
 */
export async function verifyToken(token: string | undefined | null): Promise<string> {
  if (!token) throw new Error('Missing token')
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) throw new Error(error?.message ?? 'Invalid token')
  return data.user.id
}

/** Extract a bearer token from an Authorization header value. */
export function bearerToken(header: string | undefined): string | null {
  if (!header) return null
  const match = /^Bearer\s+(.+)$/i.exec(header)
  return match ? match[1] : null
}
