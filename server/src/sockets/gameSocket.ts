import type { Server, Socket } from 'socket.io'
import { verifyToken } from '../utils/jwt.js'
import * as game from '../services/gameService.js'
import * as profiles from '../services/profileService.js'
import * as boards from '../services/boardService.js'
import type { PrizeSlot } from '../models/game.js'

// Tracks which users have already triggered a "joined" system message per room,
// so a page refresh (which re-emits room:join) doesn't spam the chat.
const announced = new Map<string, Set<string>>()

function markAnnounced(roomId: string, userId: string): boolean {
  let set = announced.get(roomId)
  if (!set) {
    set = new Set()
    announced.set(roomId, set)
  }
  if (set.has(userId)) return false
  set.add(userId)
  return true
}

function systemMessage(io: Server, roomId: string, message: string): void {
  io.to(roomId).emit('chat:message', {
    playerId: '',
    playerName: '',
    message,
    timestamp: Date.now(),
  })
}

export function registerGameSocket(io: Server): void {
  // Authenticate every socket connection with the Supabase JWT.
  io.use((socket, next) => {
    try {
      socket.data.userId = verifyToken(socket.handshake.auth?.token)
      next()
    } catch {
      next(new Error('No autorizado'))
    }
  })

  io.on('connection', (socket: Socket) => {
    const userId: string = socket.data.userId

    /** Register an async handler that reports thrown errors back to the client. */
    const on = (event: string, handler: (payload: any) => Promise<void> | void) => {
      socket.on(event, (payload) => {
        Promise.resolve()
          .then(() => handler(payload ?? {}))
          .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Error inesperado'
            socket.emit('error', { message })
          })
      })
    }

    // ── Lobby ──────────────────────────────────────────────────────
    on('room:join', async ({ roomId }) => {
      let room = game.getRoom(roomId)
      if (!room) throw new Error('Sala no encontrada')

      // Auto-enroll if the socket connected without the REST join (e.g. a
      // direct link). Normally the player is already present.
      let player = room.players.find((p) => p.id === userId)
      if (!player) {
        const profile = await profiles.getProfile(userId)
        if (!profile) throw new Error('Perfil no encontrado')
        const joined = game.joinRoom(roomId, {
          id: userId,
          name: profile.displayName,
          balance: profile.balance,
        })
        room = joined.room
        player = joined.player
      }

      socket.join(roomId)
      socket.data.roomId = roomId

      socket.emit('room:joined', { room, player })
      socket.to(roomId).emit('room:player_joined', { player })

      if (markAnnounced(roomId, userId)) {
        systemMessage(io, roomId, `${player.name} se unió`)
      }
    })

    on('room:configure', ({ roomId, entryFee }) => {
      const room = game.configureRoom(roomId, userId, entryFee)
      io.to(roomId).emit('room:updated', { room })
    })

    on('board:select', async ({ roomId, boardId, isCustom }) => {
      let customBoard = null
      const room = game.getRoom(roomId)
      const alreadyInPool = room?.availableBoards.some((b) => b.id === boardId)
      if (isCustom && !alreadyInPool) {
        customBoard = await boards.getBoard(userId, boardId)
      }

      const result = game.selectBoard(roomId, userId, boardId, !!isCustom, customBoard)
      if (result.action === 'add') {
        io.to(roomId).emit('board:locked', { boardId, playerId: userId, isCustom: result.isCustom })
      } else {
        io.to(roomId).emit('board:unlocked', { boardId, playerId: userId })
      }
    })

    // ── Game ───────────────────────────────────────────────────────
    on('game:start', async ({ roomId }) => {
      const room = await game.startGame(roomId, userId)
      io.to(roomId).emit('game:started', { room })
      systemMessage(io, roomId, '¡Comienza la partida!')
    })

    on('game:draw', async ({ roomId }) => {
      const { card, exhausted } = game.drawCard(roomId, userId)
      io.to(roomId).emit('game:card_drawn', { card })
      if (exhausted) {
        const room = await game.endByExhaustion(roomId)
        io.to(roomId).emit('game:ended', { room, reason: 'deck_exhausted' })
      }
    })

    on('game:mark', ({ roomId, cardId, boardIndex }) => {
      const { board } = game.markCard(roomId, userId, Number(cardId), Number(boardIndex))
      // A board is private to its owner; send the update only to this socket.
      socket.emit('game:card_marked', { playerId: userId, board })
    })

    on('game:loteria', async ({ roomId, slot }) => {
      const { room, slot: claimedSlot, ended } = await game.claimPrize(
        roomId,
        userId,
        slot as PrizeSlot,
      )
      io.to(roomId).emit('game:prize_claimed', { slot: claimedSlot, room })
      if (ended) {
        io.to(roomId).emit('game:ended', { room, reason: ended })
      }
    })

    on('game:restart', async ({ roomId }) => {
      const room = await game.restartGame(roomId, userId)
      io.to(roomId).emit('game:restarted', { room })
      systemMessage(io, roomId, '¡Nueva partida!')
    })

    // ── Chat ───────────────────────────────────────────────────────
    on('chat:message', ({ roomId, message }) => {
      const text = String(message ?? '').trim().slice(0, 200)
      if (!text) return
      const room = game.getRoom(roomId)
      const player = room?.players.find((p) => p.id === userId)
      io.to(roomId).emit('chat:message', {
        playerId: userId,
        playerName: player?.name ?? 'Jugador',
        message: text,
        timestamp: Date.now(),
      })
    })
  })
}
