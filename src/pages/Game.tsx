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

  const setError = useGameStore((s) => s.setError)
  const resetGame = useGameStore((s) => s.resetGame)
  const resetForNewGame = useGameStore((s) => s.resetForNewGame)
  const disconnectSocket = useGameStore((s) => s.disconnectSocket)

  // Reconnect if page was refreshed mid-game
  useEffect(() => {
    if (!playerId || !roomId) {
      navigate('/')
      return
    }
    if (!useGameStore.getState().socket) {
      const socket = useGameStore.getState().initSocket()
      socket.emit('room:join', { roomId, playerId })
    }
  }, [playerId, roomId, navigate])

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

    socket.on('game:restarted', ({ room }) => {
      useGameStore.getState().resetForNewGame(room)
    })

    socket.on('error', ({ message }) => {
      useGameStore.getState().setError(message)
    })

    return () => {
      socket.off('game:card_drawn')
      socket.off('game:card_marked')
      socket.off('game:winner')
      socket.off('game:restarted')
      socket.off('error')
    }
  }, [])

  const drawnCardIds = useMemo(
    () => new Set(drawnCards.map((c) => c.id)),
    [drawnCards],
  )

  const winPattern = myBoard ? detectWin(myBoard) : null
  const deckExhausted = room ? drawnCards.length >= room.deck.length : false

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
    disconnectSocket()
    resetGame()
    navigate('/')
  }

  const handleNewGame = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:restart', { roomId, playerId })
  }

  const handleLeave = () => {
    disconnectSocket()
    resetGame()
    navigate('/')
  }

  return (
    <div>
      {winner && (
        <WinnerOverlay
          playerName={winner.playerName}
          pattern={winner.pattern}
          isMe={winner.playerId === playerId}
          isHost={isHost}
          onClose={handleCloseWinner}
          onNewGame={handleNewGame}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ margin: 0 }}>Sala {roomId}</h3>
          {room && (
            <span>Jugadores: {room.players.map((p) => p.name).join(', ')}</span>
          )}
        </div>
        <button onClick={handleLeave}>Salir del juego</button>
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
