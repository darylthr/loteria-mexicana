import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

/**
 * Admin Supabase client using the service-role key. This bypasses Row Level
 * Security, so it must never be exposed to the browser — it lives only on the
 * server and is the single point of database I/O for profiles and boards.
 */
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
