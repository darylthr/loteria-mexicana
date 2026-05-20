import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { detectClaimablePrize } from '../utils/winDetection'
import PlayerBoard from '../components/PlayerBoard'
import CurrentCard from '../components/CurrentCard'
import DrawnCards from '../components/DrawnCards'
import WinnerOverlay from '../components/WinnerOverlay'
import PrizeStatus from '../components/PrizeStatus'
import Chat from '../components/Chat'

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

  useEffect(() => {
    if (!playerId || !roomId) {
      navigate('/')
      return
    }
    if (!useGameStore.getState().socket) {
      const socket = useGameStore.getState().initSocket()
      socket.emit('room:join', { roomId })
    }
  }, [playerId, roomId, navigate])

  useEffect(() => {
    const socket = useGameStore.getState().socket
    if (!socket) return

    socket.on('game:card_drawn', ({ card }) => {
      useGameStore.getState().cardDrawn(card)
    })

    socket.on('game:card_marked', ({ playerId: markedBy, board }) => {
      if (markedBy === useGameStore.getState().playerId) {
        useGameStore.getState().updateBoard(board)
      }
    })

    socket.on('game:prize_claimed', ({ slot, room }) => {
      const claim = room.claimedPrizes[slot]
      if (claim) useGameStore.getState().setPrizeClaimed(slot, claim, room)
    })

    socket.on('game:ended', ({ room, reason }) => {
      useGameStore.getState().setGameEnded(reason, room)
    })

    socket.on('game:restarted', ({ room }) => {
      useGameStore.getState().resetForNewGame(room)
    })

    socket.on('error', ({ message }) => {
      useGameStore.getState().setError(message)
    })

    return () => {
      socket.off('game:card_drawn')
      socket.off('game:card_marked')
      socket.off('game:prize_claimed')
      socket.off('game:ended')
      socket.off('game:restarted')
      socket.off('error')
    }
  }, [])

  const drawnCardIds = useMemo(
    () => new Set(drawnCards.map((c) => c.id)),
    [drawnCards],
  )

  const claimablePrize = detectClaimablePrize(myBoards, claimedPrizes)
  const deckExhausted = room ? drawnCards.length >= room.deck.length : false

  const handleDraw = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    socket.emit('game:draw', { roomId })
  }

  const handleMark = (cardId: number, boardIndex: number) => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    socket.emit('game:mark', { roomId, cardId, boardIndex })
  }

  const handleLoteria = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    socket.emit('game:loteria', { roomId })
  }

  const handleNewGame = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    socket.emit('game:restart', { roomId })
  }

  const handleCloseGame = () => {
    disconnectSocket()
    resetGame()
    navigate('/')
  }

  const handleLeave = () => {
    disconnectSocket()
    resetGame()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100">
      {gameEnded && room && (
        <WinnerOverlay
          room={room}
          myPlayerId={playerId}
          reason={gameEnded.reason}
          isHost={isHost}
          onNewGame={handleNewGame}
          onClose={handleCloseGame}
        />
      )}

      {/* Top bar */}
      <header className="bg-stone-800 border-b border-stone-700 px-4 py-3">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-black text-amber-400 text-lg">Lotería</span>
            <span className="ml-3 text-stone-400 text-sm font-mono tracking-widest">{roomId}</span>
            {room && (
              <span className="ml-3 text-stone-500 text-sm">
                {room.players.map((p) => p.name).join(', ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-400">
              Monedas: <strong className="text-amber-400">{balance}</strong>
            </span>
            <button
              onClick={handleLeave}
              className="px-3 py-1.5 text-sm text-stone-400 hover:text-white hover:bg-stone-700 rounded-lg transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 py-5 flex gap-5 items-start">

        {/* Left panel: card + controls + prizes */}
        <div className="w-52 shrink-0 space-y-4">
          <CurrentCard card={currentCard} />

          <div className="space-y-2">
            {isHost && (
              <button
                onClick={handleDraw}
                disabled={deckExhausted || room?.status !== 'playing'}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
              >
                {deckExhausted ? 'Mazo agotado' : 'Siguiente carta'}
              </button>
            )}
            <button
              onClick={handleLoteria}
              disabled={!claimablePrize}
              className={`w-full py-2.5 font-bold rounded-xl transition-all text-sm ${
                claimablePrize
                  ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse shadow-lg shadow-green-500/30'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              ¡Lotería!
            </button>
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-xs flex items-start gap-2">
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 shrink-0">×</button>
            </div>
          )}

          {room && (
            <PrizeStatus
              pot={room.pot}
              claimedPrizes={claimedPrizes}
              myPlayerId={playerId}
            />
          )}
        </div>

        {/* Center: boards */}
        <div className="flex-1 min-w-0 space-y-5">
          <div className="flex gap-6 flex-wrap">
            {myBoards.map((board) => (
              <div key={board.boardIndex}>
                {myBoards.length > 1 && (
                  <p className="mb-2 text-sm font-bold text-stone-400 uppercase tracking-wide">
                    Tablero {board.boardIndex + 1}
                  </p>
                )}
                <PlayerBoard
                  board={board}
                  drawnCardIds={drawnCardIds}
                  onMark={(cardId) => handleMark(cardId, board.boardIndex)}
                />
              </div>
            ))}
          </div>

          <div className="bg-stone-800 rounded-2xl border border-stone-700 p-4">
            <DrawnCards cards={drawnCards} />
          </div>
        </div>

        {/* Right: chat */}
        <div className="w-64 shrink-0 sticky top-5 h-[600px]">
          <Chat />
        </div>
      </div>
    </div>
  )
}
