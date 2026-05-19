import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { io, Socket } from 'socket.io-client'
import type { GameRoom, Player, PlayerBoard, LoteriaCard, WinPattern } from '../types/game'

interface Identity {
  playerId: string | null
  playerName: string | null
  isHost: boolean
  roomId: string | null
}

interface GameState extends Identity {
  room: GameRoom | null
  myBoard: PlayerBoard | null
  currentCard: LoteriaCard | null
  drawnCards: LoteriaCard[]
  winner: { playerId: string; playerName: string; pattern: WinPattern } | null
  error: string | null
  socket: Socket | null
  connected: boolean

  setIdentity: (identity: Identity) => void
  initSocket: () => Socket
  setRoom: (room: GameRoom) => void
  setMyBoard: (board: PlayerBoard) => void
  addPlayer: (player: Player) => void
  cardDrawn: (card: LoteriaCard) => void
  setWinner: (winner: { playerId: string; playerName: string; pattern: WinPattern }) => void
  setError: (error: string | null) => void
  resetGame: () => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerId: null,
      playerName: null,
      isHost: false,
      roomId: null,
      room: null,
      myBoard: null,
      currentCard: null,
      drawnCards: [],
      winner: null,
      error: null,
      socket: null,
      connected: false,

      setIdentity: (identity) => set(identity),

      initSocket: () => {
        const existing = get().socket
        if (existing?.connected) return existing

        const socket = io({ autoConnect: false })
        socket.on('connect', () => set({ connected: true }))
        socket.on('disconnect', () => set({ connected: false }))
        socket.connect()
        set({ socket })
        return socket
      },

      setRoom: (room) => set({ room }),

      setMyBoard: (myBoard) => set({ myBoard }),

      addPlayer: (player) =>
        set((s) => ({
          room: s.room
            ? { ...s.room, players: [...s.room.players, player] }
            : null,
        })),

      cardDrawn: (card) =>
        set((s) => ({
          currentCard: card,
          drawnCards: [...s.drawnCards, card],
        })),

      setWinner: (winner) => set({ winner }),

      setError: (error) => set({ error }),

      resetGame: () =>
        set({
          room: null,
          myBoard: null,
          currentCard: null,
          drawnCards: [],
          winner: null,
          error: null,
        }),
    }),
    {
      name: 'loteria-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        playerId: state.playerId,
        playerName: state.playerName,
        isHost: state.isHost,
        roomId: state.roomId,
      }),
    },
  ),
)
