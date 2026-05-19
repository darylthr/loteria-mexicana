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

export function fetchRoom(roomId: string): Promise<{ room: GameRoom }> {
  return request(`/rooms/${roomId}`)
}

export function createRoom(
  hostName: string,
  entryFee: number,
  numBoards: number,
): Promise<{ roomId: string; hostId: string; room: GameRoom }> {
  return request('/rooms', {
    method: 'POST',
    body: JSON.stringify({ hostName, entryFee, numBoards }),
  })
}

export function joinRoom(
  roomId: string,
  playerName: string,
  numBoards: number,
): Promise<{ room: GameRoom; player: Player }> {
  return request(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ playerName, numBoards }),
  })
}
