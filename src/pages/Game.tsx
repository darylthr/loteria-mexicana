import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { detectClaimablePrize } from '../utils/winDetection'
import PlayerBoard from '../components/PlayerBoard'
import CurrentCard from '../components/CurrentCard'
import DrawnCards from '../components/DrawnCards'
import WinnerOverlay from '../components/WinnerOverlay'
import PrizeStatus from '../components/PrizeStatus'
import Chat from '../components/Chat'
import { TokenSelector } from '../components/TokenMarker'
import type { TokenType } from '../components/TokenMarker'

export default function Game() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const playerId = useGameStore((s) => s.playerId)
  const isHost = useGameStore((s) => s.isHost)
  const room = useGameStore((s) => s.room)
  const myBoards = useGameStore((s) => s.myBoards)
  const balance = useGameStore((s) => s.balance)
  const currentCard = useGameStore((s) => s.currentCard)
  const drawnCards = useGameStore((s) => s.drawnCards)
  const claimedPrizes = useGameStore((s) => s.claimedPrizes)
  const gameEnded = useGameStore((s) => s.gameEnded)
  const error = useGameStore((s) => s.error)

  const setError = useGameStore((s) => s.setError)
  const resetGame = useGameStore((s) => s.resetGame)
  const disconnectSocket = useGameStore((s) => s.disconnectSocket)

  const [token, setToken] = useState<TokenType>(() =>
    (localStorage.getItem('loteria-token') as TokenType | null) ?? 'bean'
  )
  const handleToken = (t: TokenType) => { setToken(t); localStorage.setItem('loteria-token', t) }

  useEffect(() => {
    if (!playerId || !roomId) { navigate('/'); return }
    if (!useGameStore.getState().socket) {
      const socket = useGameStore.getState().initSocket()
      socket.emit('room:join', { roomId })
    }
  }, [playerId, roomId, navigate])

  useEffect(() => {
    const socket = useGameStore.getState().socket
    if (!socket) return

    socket.on('game:card_drawn', ({ card }) => { useGameStore.getState().cardDrawn(card) })
    socket.on('game:card_marked', ({ playerId: markedBy, board }) => {
      if (markedBy === useGameStore.getState().playerId) useGameStore.getState().updateBoard(board)
    })
    socket.on('game:prize_claimed', ({ slot, room }) => {
      const claim = room.claimedPrizes[slot]
      if (claim) useGameStore.getState().setPrizeClaimed(slot, claim, room)
    })
    socket.on('game:ended', ({ room, reason }) => { useGameStore.getState().setGameEnded(reason, room) })
    socket.on('game:restarted', ({ room }) => { useGameStore.getState().resetForNewGame(room) })
    socket.on('error', ({ message }) => { useGameStore.getState().setError(message) })

    return () => {
      socket.off('game:card_drawn')
      socket.off('game:card_marked')
      socket.off('game:prize_claimed')
      socket.off('game:ended')
      socket.off('game:restarted')
      socket.off('error')
    }
  }, [])

  const drawnCardIds = useMemo(() => new Set(drawnCards.map((c) => c.id)), [drawnCards])
  const claimablePrize = detectClaimablePrize(myBoards, claimedPrizes)
  const deckExhausted = room ? drawnCards.length >= room.deck.length : false

  const handleDraw = () => {
    const s = useGameStore.getState().socket
    if (s && roomId) s.emit('game:draw', { roomId })
  }
  const handleMark = (cardId: number, boardIndex: number) => {
    const s = useGameStore.getState().socket
    if (s && roomId) s.emit('game:mark', { roomId, cardId, boardIndex })
  }
  const handleLoteria = () => {
    const s = useGameStore.getState().socket
    if (s && roomId) s.emit('game:loteria', { roomId })
  }
  const handleNewGame = () => {
    const s = useGameStore.getState().socket
    if (s && roomId) s.emit('game:restart', { roomId })
  }
  const handleClose = () => { disconnectSocket(); resetGame(); navigate('/') }

  return (
    <div className="h-screen flex flex-col bg-stone-900 text-stone-100 overflow-hidden">
      {gameEnded && room && (
        <WinnerOverlay
          room={room}
          myPlayerId={playerId}
          reason={gameEnded.reason}
          isHost={isHost}
          onNewGame={handleNewGame}
          onClose={handleClose}
        />
      )}

      {/* Header */}
      <header className="shrink-0 bg-stone-800 border-b border-stone-700 px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-black text-amber-400 text-lg tracking-tight">Lotería</span>
          <span className="text-stone-500 text-sm font-mono tracking-widest">{roomId}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-400">
            Monedas: <strong className="text-amber-400">{balance}</strong>
          </span>
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-sm text-stone-400 hover:text-white hover:bg-stone-700 rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main 3-column area */}
      <div className="flex-1 flex gap-4 px-4 py-4 min-h-0 overflow-hidden">

        {/* LEFT — prizes + current card + actions */}
        <div className="w-44 shrink-0 flex flex-col gap-3 overflow-y-auto">
          {room && (
            <PrizeStatus pot={room.pot} claimedPrizes={claimedPrizes} myPlayerId={playerId} />
          )}
          <CurrentCard card={currentCard} />
          <div className="space-y-2">
            {isHost && (
              <button
                onClick={handleDraw}
                disabled={deckExhausted || room?.status !== 'playing'}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
              >
                {deckExhausted ? 'Mazo agotado' : 'Sacar carta'}
              </button>
            )}
            <button
              onClick={handleLoteria}
              disabled={!claimablePrize}
              className={`w-full py-2 font-bold rounded-xl transition-all text-sm ${
                claimablePrize
                  ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              ¡Lotería!
            </button>
          </div>
          <TokenSelector value={token} onChange={handleToken} />

          {error && (
            <div className="px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-xs flex gap-2">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="shrink-0 hover:text-red-100">×</button>
            </div>
          )}
        </div>

        {/* CENTER — my boards */}
        <div className="flex-1 flex flex-wrap items-start justify-center gap-5 min-w-0 overflow-y-auto content-start pt-4">
          {myBoards.map((board) => (
            <div key={board.boardIndex} className="shrink-0">
              {myBoards.length > 1 && (
                <p className="mb-1.5 text-xs font-bold text-stone-500 uppercase tracking-widest text-center">
                  Tablero {board.boardIndex + 1}
                </p>
              )}
              <PlayerBoard
                board={board}
                drawnCardIds={drawnCardIds}
                token={token}
                onMark={(cardId) => handleMark(cardId, board.boardIndex)}
              />
            </div>
          ))}
        </div>

        {/* RIGHT — players + chat */}
        <div className="w-64 shrink-0 flex flex-col gap-3 overflow-hidden">
          {/* Players */}
          <div className="bg-stone-800 border border-stone-700 rounded-2xl p-3 shrink-0">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-2">
              Jugadores
            </p>
            <ul className="space-y-1.5">
              {room?.players.map(p => {
                const isMe = p.id === playerId
                const hasClaim = Object.values(claimedPrizes).some(c => c?.playerId === p.id)
                return (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <span className={`font-medium truncate ${isMe ? 'text-amber-400' : 'text-stone-200'}`}>
                      {p.id === room?.hostId && <span className="mr-1 text-xs">👑</span>}
                      {p.name}
                      {isMe && <span className="text-stone-500 text-xs ml-1">(tú)</span>}
                    </span>
                    {hasClaim && <span className="ml-2 text-green-400 text-xs shrink-0">★</span>}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Chat fills remaining height */}
          <div className="flex-1 min-h-0">
            <Chat />
          </div>
        </div>
      </div>

      {/* BOTTOM — drawn cards */}
      <div className="shrink-0 bg-stone-800 border-t border-stone-700 px-4 py-3">
        <DrawnCards cards={drawnCards} />
      </div>
    </div>
  )
}
