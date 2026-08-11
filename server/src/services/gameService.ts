import { randomBytes } from 'node:crypto'
import type {
  AvailableBoard,
  GameEndReason,
  GameRoom,
  LoteriaCard,
  Player,
  PlayerBoard,
  PrizeClaim,
  PrizeSlot,
} from '../models/game.js'
import { boardCardsFromIds, freshDeck, generateSharedBoards } from '../game/deck.js'
import { findWinningPattern, PRIZE_SLOTS, prizeAmount } from '../game/winPatterns.js'
import * as profiles from './profileService.js'
import type { CustomBoard } from './boardService.js'

/** Coin bonus awarded per custom board a player brings to a round. */
const CUSTOM_BOARD_BONUS = 10
const MAX_BOARDS_PER_PLAYER = 2
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I

// ── In-memory room store ─────────────────────────────────────────────
const rooms = new Map<string, GameRoom>()

function generateRoomId(): string {
  let code: string
  do {
    code = Array.from(randomBytes(6))
      .map((b) => ROOM_CODE_CHARS[b % ROOM_CODE_CHARS.length])
      .join('')
  } while (rooms.has(code))
  return code
}

export function getRoom(roomId: string): GameRoom | undefined {
  return rooms.get(roomId)
}

export function requireRoom(roomId: string): GameRoom {
  const room = rooms.get(roomId)
  if (!room) throw new Error('Sala no encontrada')
  return room
}

function requireHost(room: GameRoom, playerId: string): void {
  if (room.hostId !== playerId) throw new Error('Solo el anfitrión puede hacer esto')
}

function selectionsOf(room: GameRoom, playerId: string) {
  const sels = room.boardSelections[playerId]
  return Array.isArray(sels) ? sels : []
}

// ── Room lifecycle ───────────────────────────────────────────────────

export interface PlayerIdentity {
  id: string
  name: string
  balance: number
}

export function createRoom(host: PlayerIdentity, maxPlayers = 6): { room: GameRoom; hostId: string } {
  const roomId = generateRoomId()
  const hostPlayer: Player = {
    id: host.id,
    name: host.name,
    boards: [],
    status: 'waiting',
    balance: host.balance,
  }
  const room: GameRoom = {
    roomId,
    hostId: host.id,
    players: [hostPlayer],
    deck: [],
    drawnCards: [],
    currentCard: null,
    status: 'lobby',
    maxPlayers: Math.min(Math.max(maxPlayers, 2), 12),
    entryFee: 0,
    pot: 0,
    claimedPrizes: {},
    availableBoards: generateSharedBoards(),
    boardSelections: {},
  }
  rooms.set(roomId, room)
  return { room, hostId: host.id }
}

/** Add a player to a room (idempotent). Returns the room and the player. */
export function joinRoom(roomId: string, identity: PlayerIdentity): { room: GameRoom; player: Player } {
  const room = requireRoom(roomId)
  const existing = room.players.find((p) => p.id === identity.id)
  if (existing) {
    // Refresh their display name/balance in case it changed; keep boards.
    existing.name = identity.name
    existing.balance = identity.balance
    return { room, player: existing }
  }
  if (room.status !== 'lobby') throw new Error('La partida ya comenzó')
  if (room.players.length >= room.maxPlayers) throw new Error('La sala está llena')

  const player: Player = {
    id: identity.id,
    name: identity.name,
    boards: [],
    status: 'waiting',
    balance: identity.balance,
  }
  room.players.push(player)
  return { room, player }
}

export function configureRoom(roomId: string, playerId: string, entryFee: number): GameRoom {
  const room = requireRoom(roomId)
  requireHost(room, playerId)
  if (room.status !== 'lobby') throw new Error('No se puede cambiar el costo durante la partida')
  const fee = Math.floor(Number(entryFee))
  if (!Number.isFinite(fee) || fee < 0 || fee > 500) throw new Error('Costo de entrada inválido')
  room.entryFee = fee
  return room
}

// ── Board selection (lobby) ──────────────────────────────────────────

export interface SelectResult {
  room: GameRoom
  board: AvailableBoard
  action: 'add' | 'remove'
  isCustom: boolean
}

/**
 * Toggle a board selection for a player. For a custom board not yet present in
 * the room, pass its definition in `customBoard` so it can be added to the pool.
 */
export function selectBoard(
  roomId: string,
  playerId: string,
  boardId: string,
  isCustom: boolean,
  customBoard?: CustomBoard | null,
): SelectResult {
  const room = requireRoom(roomId)
  if (room.status !== 'lobby') throw new Error('La selección de tableros ya cerró')
  if (!room.players.some((p) => p.id === playerId)) throw new Error('No estás en esta sala')

  let board = room.availableBoards.find((b) => b.id === boardId)

  // Lazily add the player's custom board to the room pool the first time.
  if (!board && isCustom) {
    if (!customBoard) throw new Error('Tablero personalizado no encontrado')
    board = {
      id: customBoard.id,
      cards: boardCardsFromIds(customBoard.cardIds),
      isCustom: true,
      addedByPlayerId: playerId,
      lockedByPlayerId: null,
    }
    room.availableBoards.push(board)
  }
  if (!board) throw new Error('Tablero no encontrado')

  const current = selectionsOf(room, playerId)
  const alreadySelected = current.some((s) => s.boardId === boardId)

  if (alreadySelected) {
    board.lockedByPlayerId = null
    room.boardSelections[playerId] = current.filter((s) => s.boardId !== boardId)
    return { room, board, action: 'remove', isCustom: board.isCustom }
  }

  if (board.lockedByPlayerId && board.lockedByPlayerId !== playerId) {
    throw new Error('Ese tablero ya está tomado')
  }
  if (current.length >= MAX_BOARDS_PER_PLAYER) {
    throw new Error(`Máximo ${MAX_BOARDS_PER_PLAYER} tableros por jugador`)
  }

  board.lockedByPlayerId = playerId
  room.boardSelections[playerId] = [...current, { boardId, isCustom: board.isCustom }]
  return { room, board, action: 'add', isCustom: board.isCustom }
}

// ── Round start / restart ────────────────────────────────────────────

function buildPlayerBoards(room: GameRoom, playerId: string): PlayerBoard[] {
  const selections = selectionsOf(room, playerId)
  return selections.map((sel, boardIndex) => {
    const source = room.availableBoards.find((b) => b.id === sel.boardId)
    if (!source) throw new Error('Tablero seleccionado no disponible')
    return {
      playerId,
      boardIndex,
      cards: source.cards.map((c) => ({ ...c, isDrawn: false })),
      markedCards: [],
    }
  })
}

/**
 * Charge entry fees, apply custom-board bonuses, deal boards and a fresh deck.
 * Shared by the first start and every restart. Validates that every player can
 * afford entry BEFORE mutating any balance, so a failure leaves state intact.
 */
async function beginRound(room: GameRoom): Promise<void> {
  const plans = room.players.map((player) => {
    const selections = selectionsOf(room, player.id)
    const customCount = selections.filter((s) => s.isCustom).length
    return {
      player,
      count: selections.length,
      cost: room.entryFee * selections.length,
      bonus: CUSTOM_BOARD_BONUS * customCount,
    }
  })

  for (const plan of plans) {
    if (plan.count === 0) throw new Error(`${plan.player.name} no eligió tablero`)
  }

  // Verify affordability against live balances first.
  const balances = await Promise.all(plans.map((p) => profiles.getBalance(p.player.id)))
  plans.forEach((plan, i) => {
    if (balances[i] < plan.cost) {
      throw new Error(`${plan.player.name} no tiene monedas suficientes`)
    }
  })

  // Apply: deduct fee into the pot, credit the custom-board bonus, deal boards.
  room.pot = 0
  for (const plan of plans) {
    let balance = balances[plans.indexOf(plan)]
    if (plan.cost > 0) balance = await profiles.deductCoins(plan.player.id, plan.cost)
    room.pot += plan.cost
    if (plan.bonus > 0) balance = await profiles.addCoins(plan.player.id, plan.bonus)
    plan.player.balance = balance
    plan.player.boards = buildPlayerBoards(room, plan.player.id)
    plan.player.status = 'playing'
  }

  room.deck = freshDeck()
  room.drawnCards = []
  room.currentCard = null
  room.claimedPrizes = {}
  room.status = 'playing'
}

export async function startGame(roomId: string, playerId: string): Promise<GameRoom> {
  const room = requireRoom(roomId)
  requireHost(room, playerId)
  if (room.status !== 'lobby') throw new Error('La partida ya comenzó')
  if (room.players.length < 2) throw new Error('Se necesitan al menos 2 jugadores')
  await beginRound(room)
  return room
}

export async function restartGame(roomId: string, playerId: string): Promise<GameRoom> {
  const room = requireRoom(roomId)
  requireHost(room, playerId)
  if (room.status === 'lobby') throw new Error('La partida aún no ha comenzado')
  await beginRound(room)
  return room
}

// ── In-game actions ──────────────────────────────────────────────────

export function drawCard(roomId: string, playerId: string): { room: GameRoom; card: LoteriaCard; exhausted: boolean } {
  const room = requireRoom(roomId)
  requireHost(room, playerId)
  if (room.status !== 'playing') throw new Error('La partida no está activa')
  if (room.drawnCards.length >= room.deck.length) throw new Error('El mazo se agotó')

  const card = room.deck[room.drawnCards.length]
  card.isDrawn = true
  room.currentCard = card
  room.drawnCards.push(card)

  const exhausted = room.drawnCards.length >= room.deck.length
  return { room, card, exhausted }
}

export function markCard(
  roomId: string,
  playerId: string,
  cardId: number,
  boardIndex: number,
): { room: GameRoom; board: PlayerBoard } {
  const room = requireRoom(roomId)
  if (room.status !== 'playing') throw new Error('La partida no está activa')

  const player = room.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Jugador no encontrado')

  const board = player.boards.find((b) => b.boardIndex === boardIndex)
  if (!board) throw new Error('Tablero no encontrado')
  if (!board.cards.some((c) => c.id === cardId)) throw new Error('Esa carta no está en tu tablero')
  if (!room.drawnCards.some((c) => c.id === cardId)) throw new Error('Esa carta aún no ha salido')

  if (!board.markedCards.includes(cardId)) board.markedCards.push(cardId)
  return { room, board }
}

export interface ClaimResult {
  room: GameRoom
  slot: PrizeSlot
  claim: PrizeClaim
  ended: GameEndReason | null
}

export async function claimPrize(roomId: string, playerId: string, slot: PrizeSlot): Promise<ClaimResult> {
  const room = requireRoom(roomId)
  if (room.status !== 'playing') throw new Error('La partida no está activa')
  if (!PRIZE_SLOTS.includes(slot)) throw new Error('Premio inválido')
  if (room.claimedPrizes[slot]) throw new Error('Ese premio ya fue reclamado')

  const player = room.players.find((p) => p.id === playerId)
  if (!player) throw new Error('Jugador no encontrado')

  const drawn = new Set(room.drawnCards.map((c) => c.id))
  let match: { boardIndex: number; pattern: PrizeClaim['pattern'] } | null = null
  for (const board of player.boards) {
    const pattern = findWinningPattern(board, slot, drawn)
    if (pattern) {
      match = { boardIndex: board.boardIndex, pattern }
      break
    }
  }
  if (!match) throw new Error('Todavía no completas ese premio')

  const amount = prizeAmount(slot, room.pot)
  player.balance = await profiles.addCoins(player.id, amount)

  const claim: PrizeClaim = {
    playerId: player.id,
    playerName: player.name,
    boardIndex: match.boardIndex,
    pattern: match.pattern,
    amount,
  }
  room.claimedPrizes[slot] = claim

  let ended: GameEndReason | null = null
  if (PRIZE_SLOTS.every((s) => room.claimedPrizes[s])) {
    await endGame(room, 'all_prizes_claimed')
    ended = 'all_prizes_claimed'
  }

  return { room, slot, claim, ended }
}

/**
 * End the round. On deck exhaustion, any pot value not tied to a claimed prize
 * is split evenly among all players (per the winner-overlay copy).
 */
export async function endGame(room: GameRoom, reason: GameEndReason): Promise<GameRoom> {
  room.status = 'finished'

  if (reason === 'deck_exhausted') {
    const claimed = PRIZE_SLOTS.reduce((sum, s) => sum + (room.claimedPrizes[s]?.amount ?? 0), 0)
    const remaining = Math.max(0, room.pot - claimed)
    const share = room.players.length > 0 ? Math.floor(remaining / room.players.length) : 0
    if (share > 0) {
      for (const player of room.players) {
        player.balance = await profiles.addCoins(player.id, share)
      }
    }
  }
  return room
}

/** Called by the socket layer after a draw that exhausts the deck. */
export async function endByExhaustion(roomId: string): Promise<GameRoom> {
  const room = requireRoom(roomId)
  return endGame(room, 'deck_exhausted')
}
