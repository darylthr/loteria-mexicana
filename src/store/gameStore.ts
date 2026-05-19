import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { io, Socket } from 'socket.io-client'
import type { GameRoom, Player, PlayerBoard, LoteriaCard, PrizeSlot, PrizeClaim } from '../types/game'

interface Identity {
  playerId: string | null
  playerName: string | null
  isHost: boolean
  roomId: string | null
}

interface GameState extends Identity {
  room: GameRoom | null
  myBoards: PlayerBoard[]
  balance: number
  currentCard: LoteriaCard | null
  drawnCards: LoteriaCard[]
  claimedPrizes: Partial<Record<PrizeSlot, PrizeClaim>>
  gameEnded: { reason: 'all_prizes_claimed' | 'deck_exhausted' } | null
  error: string | null
  socket: Socket | null
  connected: boolean

  setIdentity: (identity: Identity) => void
  setBalance: (balance: number) => void
  initSocket: () => Socket
  disconnectSocket: () => void
  setRoom: (room: GameRoom) => void
  setMyBoards: (boards: PlayerBoard[]) => void
  updateBoard: (board: PlayerBoard) => void
  addPlayer: (player: Player) => void
  cardDrawn: (card: LoteriaCard) => void
  setPrizeClaimed: (slot: PrizeSlot, claim: PrizeClaim, room: GameRoom) => void
  setGameEnded: (reason: 'all_prizes_claimed' | 'deck_exhausted', room: GameRoom) => void
  setError: (error: string | null) => void
  resetGame: () => void
  resetForNewGame: (room: GameRoom) => void
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      playerId: null,
      playerName: null,
      isHost: false,
      roomId: null,
      room: null,
      myBoards: [],
      balance: 0,
      currentCard: null,
      drawnCards: [],
      claimedPrizes: {},
      gameEnded: null,
      error: null,
      socket: null,
      connected: false,

      setIdentity: (identity) => set(identity),

      setBalance: (balance) => set({ balance }),

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

      disconnectSocket: () => {
        const socket = get().socket
        if (socket) socket.disconnect()
        set({ socket: null, connected: false })
      },

      setRoom: (room) => set({ room }),

      setMyBoards: (myBoards) => set({ myBoards }),

      updateBoard: (board) =>
        set((s) => ({
          myBoards: s.myBoards.map((b) =>
            b.boardIndex === board.boardIndex ? board : b
          ),
        })),

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

      setPrizeClaimed: (slot, claim, room) =>
        set((s) => {
          const myPlayer = room.players.find(p => p.id === s.playerId)
          return {
            claimedPrizes: { ...s.claimedPrizes, [slot]: claim },
            room,
            balance: myPlayer?.balance ?? s.balance,
          }
        }),

      setGameEnded: (reason, room) =>
        set((s) => {
          const myPlayer = room.players.find(p => p.id === s.playerId)
          return {
            gameEnded: { reason },
            room,
            claimedPrizes: room.claimedPrizes,
            balance: myPlayer?.balance ?? s.balance,
          }
        }),

      setError: (error) => set({ error }),

      resetGame: () =>
        set({
          room: null,
          myBoards: [],
          currentCard: null,
          drawnCards: [],
          claimedPrizes: {},
          gameEnded: null,
          error: null,
        }),

      resetForNewGame: (room) =>
        set((state) => {
          const player = room.players.find(p => p.id === state.playerId)
          return {
            room,
            myBoards: player?.boards ?? state.myBoards,
            balance: player?.balance ?? state.balance,
            currentCard: null,
            drawnCards: [],
            claimedPrizes: {},
            gameEnded: null,
            error: null,
          }
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
