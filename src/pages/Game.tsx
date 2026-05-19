import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { detectWin } from '../utils/winDetection'
import PlayerBoard from '../components/PlayerBoard'
import CurrentCard from '../components/CurrentCard'
import DrawnCards from '../components/DrawnCards'
import WinnerOverlay from '../components/WinnerOverlay'

export default function Game() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const playerId = useGameStore((s) => s.playerId)
  const isHost = useGameStore((s) => s.isHost)
  const room = useGameStore((s) => s.room)
  const myBoard = useGameStore((s) => s.myBoard)
  const currentCard = useGameStore((s) => s.currentCard)
  const drawnCards = useGameStore((s) => s.drawnCards)
  const winner = useGameStore((s) => s.winner)
  const error = useGameStore((s) => s.error)

  const setRoom = useGameStore((s) => s.setRoom)
  const setMyBoard = useGameStore((s) => s.setMyBoard)
  const cardDrawn = useGameStore((s) => s.cardDrawn)
  const setWinner = useGameStore((s) => s.setWinner)
  const setError = useGameStore((s) => s.setError)
  const resetGame = useGameStore((s) => s.resetGame)

  // Register socket event listeners once on mount.
  // Use useGameStore.getState() inside callbacks to avoid stale closures.
  useEffect(() => {
    const socket = useGameStore.getState().socket
    if (!socket) return

    socket.on('game:card_drawn', ({ card }) => {
      useGameStore.getState().cardDrawn(card)
    })

    socket.on('game:card_marked', ({ playerId: markedBy, board }) => {
      if (markedBy === useGameStore.getState().playerId) {
        useGameStore.getState().setMyBoard(board)
      }
    })

    socket.on('game:winner', ({ playerId: winnerId, playerName, pattern, room }) => {
      useGameStore.getState().setWinner({ playerId: winnerId, playerName, pattern })
      useGameStore.getState().setRoom(room)
    })

    socket.on('error', ({ message }) => {
      useGameStore.getState().setError(message)
    })

    return () => {
      socket.off('game:card_drawn')
      socket.off('game:card_marked')
      socket.off('game:winner')
      socket.off('error')
    }
  }, [])

  const drawnCardIds = useMemo(
    () => new Set(drawnCards.map((c) => c.id)),
    [drawnCards],
  )

  const winPattern = myBoard ? detectWin(myBoard) : null
  const deckExhausted = drawnCards.length >= 54

  const handleDraw = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:draw', { roomId, playerId })
  }

  const handleMark = (cardId: number) => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:mark', { roomId, playerId, cardId })
  }

  const handleLoteria = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:loteria', { roomId, playerId })
  }

  const handleCloseWinner = () => {
    resetGame()
    navigate('/')
  }

  // Suppress unused-variable warnings for store actions used only as subscriptions
  void setRoom
  void setMyBoard
  void cardDrawn
  void setWinner

  return (
    <div>
      {winner && (
        <WinnerOverlay
          playerName={winner.playerName}
          pattern={winner.pattern}
          isMe={winner.playerId === playerId}
          onClose={handleCloseWinner}
        />
      )}

      <div>
        <h3>Sala {roomId}</h3>
        {room && (
          <span>Jugadores: {room.players.map((p) => p.name).join(', ')}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <CurrentCard card={currentCard} />

          {isHost && (
            <button
              onClick={handleDraw}
              disabled={deckExhausted || room?.status !== 'playing'}
              style={{ marginTop: 12, display: 'block' }}
            >
              {deckExhausted ? 'Mazo agotado' : 'Siguiente carta'}
            </button>
          )}

          <button
            onClick={handleLoteria}
            disabled={!winPattern}
            style={{ marginTop: 8, display: 'block' }}
          >
            ¡Lotería!
          </button>

          {error && (
            <p style={{ color: 'red' }}>
              {error}{' '}
              <button onClick={() => setError(null)}>×</button>
            </p>
          )}
        </div>

        {myBoard && (
          <PlayerBoard
            board={myBoard}
            drawnCardIds={drawnCardIds}
            onMark={handleMark}
          />
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <DrawnCards cards={drawnCards} />
      </div>
    </div>
  )
}
