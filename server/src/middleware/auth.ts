import type { NextFunction, Request, Response } from 'express'
import { bearerToken, verifyToken } from '../utils/jwt.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId: string
    }
  }
}

/** Verifies the Supabase JWT and sets req.userId. Rejects with 401 otherwise. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = bearerToken(req.headers.authorization)
    req.userId = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'No autorizado' })
  }
}
