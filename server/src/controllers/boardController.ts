import type { Request, Response } from 'express'
import * as boards from '../services/boardService.js'

export async function listBoards(req: Request, res: Response): Promise<void> {
  const result = await boards.getBoards(req.userId)
  res.json({ boards: result })
}

export async function createBoard(req: Request, res: Response): Promise<void> {
  const board = await boards.createBoard(req.userId, req.body?.name, req.body?.cardIds)
  res.status(201).json({ board })
}

export async function deleteBoard(req: Request, res: Response): Promise<void> {
  await boards.deleteBoard(req.userId, req.params.boardId)
  res.json({ ok: true })
}
