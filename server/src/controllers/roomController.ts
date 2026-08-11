import type { Request, Response } from 'express'
import * as game from '../services/gameService.js'
import * as profiles from '../services/profileService.js'

async function identityFor(userId: string, nickname?: unknown): Promise<game.PlayerIdentity> {
  const profile = await profiles.getProfile(userId)
  if (!profile) throw new Error('Perfil no encontrado')
  const name = String(nickname ?? '').trim() || profile.displayName
  return { id: userId, name: name.slice(0, 24), balance: profile.balance }
}

export async function getRoomById(req: Request, res: Response): Promise<void> {
  const room = game.getRoom(req.params.roomId)
  if (!room) {
    res.status(404).json({ error: 'Sala no encontrada' })
    return
  }
  res.json({ room })
}

export async function createRoom(req: Request, res: Response): Promise<void> {
  const identity = await identityFor(req.userId, req.body?.nickname)
  const maxPlayers = Number(req.body?.maxPlayers ?? 6)
  const { room, hostId } = game.createRoom(identity, Number.isFinite(maxPlayers) ? maxPlayers : 6)
  res.status(201).json({ roomId: room.roomId, hostId, room })
}

export async function joinRoom(req: Request, res: Response): Promise<void> {
  const identity = await identityFor(req.userId, req.body?.nickname)
  const { room, player } = game.joinRoom(req.params.roomId, identity)
  res.json({ room, player })
}
