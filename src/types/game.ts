export type WinPattern =
  | 'row'
  | 'column'
  | 'diagonal'
  | 'square'
  | 'corners'
  | 'full_board'

export interface LoteriaCard {
  id: number
  name: string
  imageUrl: string
  isDrawn: boolean
}

export interface PlayerBoard {
  playerId: string
  cards: LoteriaCard[]
  markedCards: number[]
}

export interface Player {
  id: string
  name: string
  board: PlayerBoard
  status: 'waiting' | 'playing' | 'won'
}

export interface GameRoom {
  roomId: string
  hostId: string
  players: Player[]
  deck: LoteriaCard[]
  drawnCards: LoteriaCard[]
  currentCard: LoteriaCard | null
  status: 'lobby' | 'playing' | 'finished'
  maxPlayers: number
}
