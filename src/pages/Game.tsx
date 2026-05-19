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
  const resetForNewGame = useGameStore((s) => s.resetForNewGame)
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
    <div>
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ margin: 0 }}>Sala {roomId}</h3>
          {room && (
            <span style={{ fontSize: 14, opacity: 0.7 }}>
              {room.players.map((p) => p.name).join(', ')}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14 }}>Monedas: <strong>{balance}</strong></span>
          <button onClick={handleLeave}>Salir del juego</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-start' }}>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 200 }}>
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
                disabled={!claimablePrize}
                style={{ marginTop: 8, display: 'block' }}
              >
                ¡Lotería!
              </button>

              {error && (
                <p style={{ color: 'red', marginTop: 8 }}>
                  {error}{' '}
                  <button onClick={() => setError(null)}>×</button>
                </p>
              )}

              <div style={{ marginTop: 20 }}>
                {room && (
                  <PrizeStatus
                    pot={room.pot}
                    claimedPrizes={claimedPrizes}
                    myPlayerId={playerId}
                  />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {myBoards.map((board) => (
                <div key={board.boardIndex}>
                  {myBoards.length > 1 && (
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14 }}>
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
          </div>

          <div style={{ marginTop: 24 }}>
            <DrawnCards cards={drawnCards} />
          </div>
        </div>

        <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 16, height: 500 }}>
          <Chat />
        </div>

      </div>
    </div>
  )
}
