import { Router } from 'express'
import { requireAuth } from './middleware/auth.js'
import * as profile from './controllers/profileController.js'
import * as room from './controllers/roomController.js'
import * as board from './controllers/boardController.js'

/** Wraps an async handler so rejected promises reach the error middleware. */
const wrap =
  (fn: (req: any, res: any) => Promise<void>) =>
  (req: any, res: any, next: any) =>
    fn(req, res).catch(next)

export const apiRouter = Router()

// Every /api route requires a valid Supabase JWT.
apiRouter.use(requireAuth)

// Profile
apiRouter.get('/profile', wrap(profile.getMyProfile))
apiRouter.post('/profile', wrap(profile.createMyProfile))
apiRouter.patch('/profile', wrap(profile.updateMyProfile))

// Rooms
apiRouter.post('/rooms', wrap(room.createRoom))
apiRouter.get('/rooms/:roomId', wrap(room.getRoomById))
apiRouter.post('/rooms/:roomId/join', wrap(room.joinRoom))

// Custom boards
apiRouter.get('/boards', wrap(board.listBoards))
apiRouter.post('/boards', wrap(board.createBoard))
apiRouter.delete('/boards/:boardId', wrap(board.deleteBoard))
