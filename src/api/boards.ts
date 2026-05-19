import { supabase } from '../lib/supabase'

export interface CustomBoard {
  id: string
  name: string
  cardIds: number[]
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
      ...(options?.headers ?? {}),
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Request failed')
  return body
}

export function getBoards(): Promise<{ boards: CustomBoard[] }> {
  return request('/boards')
}

export function createBoard(name: string, cardIds: number[]): Promise<{ board: CustomBoard }> {
  return request('/boards', { method: 'POST', body: JSON.stringify({ name, cardIds }) })
}

export function deleteBoard(boardId: string): Promise<{ ok: boolean }> {
  return request(`/boards/${boardId}`, { method: 'DELETE' })
}
