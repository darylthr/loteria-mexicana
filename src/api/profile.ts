import { supabase } from '../lib/supabase'

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token ?? ''}`,
  }
}

export async function createProfile(displayName: string): Promise<void> {
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ displayName }),
  })
  if (!res.ok) {
    const body = await res.json()
    throw new Error(body.error ?? 'Failed to create profile')
  }
}

export async function getProfile(): Promise<{ displayName: string; balance: number }> {
  const res = await fetch('/api/profile', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}
