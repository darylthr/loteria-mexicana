import type { GameRoom, Player } from '../types/game'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.message ?? 'Request failed')
  return body
}

export function createRoom(hostName: string): Promise<{ roomId: string; hostId: string; room: GameRoom }> {
  return request('/rooms', {
    method: 'POST',
    body: JSON.stringify({ hostName }),
  })
}

export function joinRoom(
  roomId: string,
  playerName: string,
): Promise<{ room: GameRoom; player: Player }> {
  return request(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ playerName }),
  })
}
