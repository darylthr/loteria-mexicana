import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env and fill it in.`,
    )
  }
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  // No longer required: tokens are verified via the Supabase Auth server, which
  // works for both legacy HS256 and asymmetric (ES256) signing keys. Kept for
  // reference / optional local verification.
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? '',
} as const
