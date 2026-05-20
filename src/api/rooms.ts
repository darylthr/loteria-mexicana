import { supabase } from '../lib/supabase'
import type { GameRoom, Player } from '../types/game'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
      ...(options?.headers ?? {}),
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? body.error ?? 'Request failed')
  return body
}

export function fetchRoom(roomId: string): Promise<{ room: GameRoom }> {
  return request(`/rooms/${roomId}`)
}

export function createRoom(nickname?: string, maxPlayers?: number): Promise<{ roomId: string; hostId: string; room: GameRoom }> {
  return request('/rooms', {
    method: 'POST',
    body: JSON.stringify({ maxPlayers, nickname }),
  })
}

export function joinRoom(roomId: string, nickname?: string): Promise<{ room: GameRoom; player: Player }> {
  return request(`/rooms/${roomId}/join`, { method: 'POST', body: JSON.stringify({ nickname }) })
}
