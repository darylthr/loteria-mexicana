// Shared domain types. These mirror the frontend's src/types/game.ts exactly
// so the JSON that crosses the wire deserializes into the same shapes.

export type WinPattern =
  | 'row'
  | 'column'
  | 'diagonal'
  | 'square'
  | 'corners'
  | 'full_board'

export type PrizeSlot = 'full_board' | 'corners' | 'line' | 'square'

export interface PrizeClaim {
  playerId: string
  playerName: string
  boardIndex: number
  pattern: WinPattern
  amount: number
}

export interface LoteriaCard {
  id: number
  name: string
  imageUrl: string
  isDrawn: boolean
}

export interface PlayerBoard {
  playerId: string
  boardIndex: number
  cards: LoteriaCard[]
  markedCards: number[]
}

export interface Player {
  id: string
  name: string
  boards: PlayerBoard[]
  status: 'waiting' | 'playing'
  balance: number
}

export interface AvailableBoard {
  id: string
  cards: LoteriaCard[]
  isCustom: boolean
  addedByPlayerId?: string
  lockedByPlayerId: string | null
}

export type BoardSelection = { boardId: string; isCustom: boolean }

export interface GameRoom {
  roomId: string
  hostId: string
  players: Player[]
  deck: LoteriaCard[]
  drawnCards: LoteriaCard[]
  currentCard: LoteriaCard | null
  status: 'lobby' | 'playing' | 'finished'
  maxPlayers: number
  entryFee: number
  pot: number
  claimedPrizes: Partial<Record<PrizeSlot, PrizeClaim>>
  availableBoards: AvailableBoard[]
  boardSelections: Record<string, BoardSelection[]>
}

export type GameEndReason = 'all_prizes_claimed' | 'deck_exhausted'
