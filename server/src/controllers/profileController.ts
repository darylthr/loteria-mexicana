import type { Request, Response } from 'express'
import * as profiles from '../services/profileService.js'

export async function getMyProfile(req: Request, res: Response): Promise<void> {
  const profile = await profiles.getProfile(req.userId)
  if (!profile) {
    res.status(404).json({ error: 'Perfil no encontrado' })
    return
  }
  res.json(profile)
}

export async function createMyProfile(req: Request, res: Response): Promise<void> {
  const displayName = String(req.body?.displayName ?? '').trim()
  if (!displayName) {
    res.status(400).json({ error: 'El nombre es requerido' })
    return
  }
  const existing = await profiles.getProfile(req.userId)
  if (existing) {
    res.status(409).json({ error: 'El perfil ya existe' })
    return
  }
  const profile = await profiles.createProfile(req.userId, displayName.slice(0, 24))
  res.status(201).json(profile)
}

export async function updateMyProfile(req: Request, res: Response): Promise<void> {
  const displayName = String(req.body?.displayName ?? '').trim()
  if (!displayName) {
    res.status(400).json({ error: 'El nombre es requerido' })
    return
  }
  const profile = await profiles.updateProfile(req.userId, displayName.slice(0, 24))
  res.json(profile)
}
