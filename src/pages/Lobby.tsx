import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import Chat from '../components/Chat'
import BoardPicker from '../components/BoardPicker'
import BoardCreator from '../components/BoardCreator'
import { getBoards } from '../api/boards'
import type { CustomBoard } from '../api/boards'
import type { AvailableBoard } from '../types/game'

export default function Lobby() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const playerId = useGameStore((s) => s.playerId)
  const isHost = useGameStore((s) => s.isHost)
  const room = useGameStore((s) => s.room)
  const balance = useGameStore((s) => s.balance)
  const error = useGameStore((s) => s.error)

  const initSocket = useGameStore((s) => s.initSocket)
  const setRoom = useGameStore((s) => s.setRoom)
  const setMyBoards = useGameStore((s) => s.setMyBoards)
  const setBalance = useGameStore((s) => s.setBalance)
  const addPlayer = useGameStore((s) => s.addPlayer)
  const setError = useGameStore((s) => s.setError)
  const updateAvailableBoard = useGameStore((s) => s.updateAvailableBoard)

  const [feeInput, setFeeInput] = useState(0)
  const [feeSaved, setFeeSaved] = useState(true)
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null)
  const [myCustomBoards, setMyCustomBoards] = useState<CustomBoard[]>([])
  const [showCreator, setShowCreator] = useState(false)

  useEffect(() => {
    getBoards().then(({ boards }) => setMyCustomBoards(boards)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!playerId || !roomId) return

    const socket = initSocket()
    socket.emit('room:join', { roomId })

    socket.on('room:joined', ({ room, player }) => {
      setRoom(room)
      setMyBoards(player.boards)
      setBalance(player.balance)
      setFeeInput(room.entryFee)
      // Restore own selection if already made
      const sel = room.boardSelections[player.id]
      if (sel) setSelectedBoardId(sel.boardId)
      if (room.status === 'playing') navigate(`/game/${roomId}`)
    })

    socket.on('room:player_joined', ({ player }) => {
      addPlayer(player)
    })

    socket.on('room:updated', ({ room }) => {
      setRoom(room)
      setFeeInput(room.entryFee)
    })

    socket.on('board:locked', ({ boardId, playerId: lockerId, isCustom }) => {
      updateAvailableBoard(boardId, { lockedByPlayerId: lockerId })
      if (lockerId === playerId) setSelectedBoardId(boardId)
    })

    socket.on('board:unlocked', ({ boardId }) => {
      updateAvailableBoard(boardId, { lockedByPlayerId: null })
    })

    socket.on('game:started', ({ room }) => {
      const store = useGameStore.getState()
      setRoom(room)
      const me = room.players.find(p => p.id === store.playerId)
      if (me) {
        setMyBoards(me.boards)
        setBalance(me.balance)
      }
      navigate(`/game/${roomId}`)
    })

    socket.on('error', ({ message }) => setError(message))

    return () => {
      socket.off('room:joined')
      socket.off('room:player_joined')
      socket.off('room:updated')
      socket.off('board:locked')
      socket.off('board:unlocked')
      socket.off('game:started')
      socket.off('error')
    }
  }, [playerId, roomId])

  const handleSelectBoard = (boardId: string, isCustom: boolean) => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    socket.emit('board:select', { roomId, boardId, isCustom })
  }

  const handleSaveFee = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    socket.emit('room:configure', { roomId, entryFee: feeInput })
    setFeeSaved(true)
  }

  const handleStart = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    if (isHost && !feeSaved) socket.emit('room:configure', { roomId, entryFee: feeInput })
    socket.emit('game:start', { roomId })
  }

  const selectedIsCustom = selectedBoardId
    ? (room?.boardSelections[playerId!]?.isCustom ?? false)
    : false
  const estimatedCost = (room?.entryFee ?? 0) + (selectedIsCustom ? 10 : 0)
  const canAfford = balance >= estimatedCost

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <h2>Sala: {roomId}</h2>
        <p style={{ opacity: 0.7, fontSize: 14 }}>Comparte este código con tus amigos.</p>

        {/* Fee config */}
        <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px' }}>Configuración</h4>
          {isHost ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label>Costo por tablero:</label>
              <input
                type="number" min={0} max={500} value={feeInput}
                onChange={e => { setFeeInput(Number(e.target.value)); setFeeSaved(false) }}
                style={{ width: 70 }}
              />
              <button onClick={handleSaveFee} disabled={feeSaved}>{feeSaved ? 'Guardado ✓' : 'Guardar'}</button>
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 14 }}>Costo por tablero: <strong>{room?.entryFee ?? 0} monedas</strong></p>
          )}
          <p style={{ margin: '8px 0 0', fontSize: 13, color: canAfford ? undefined : 'red' }}>
            Costo al iniciar: <strong>{estimatedCost} monedas</strong>
            {selectedIsCustom && <span style={{ opacity: 0.6 }}> (incluye +10 tablero personalizado)</span>}
            {' '}· tienes {balance}
            {!canAfford && ' — monedas insuficientes'}
          </p>
        </div>

        {/* Players */}
        <h3>Jugadores ({room?.players.length ?? 0}/{room?.maxPlayers ?? 6})</h3>
        <ul style={{ paddingLeft: 20, marginBottom: 16 }}>
          {room?.players.map(p => {
            const hasSel = !!room.boardSelections[p.id]
            return (
              <li key={p.id}>
                {p.name}
                {p.id === room.hostId ? ' 👑' : ''}
                {p.id === playerId ? ' (tú)' : ''}
                {' — '}
                {hasSel
                  ? (room.boardSelections[p.id].isCustom ? '📋 tablero personalizado' : '✓ tablero elegido')
                  : <span style={{ opacity: 0.5 }}>sin tablero</span>}
              </li>
            )
          })}
        </ul>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        {isHost && (
          <button onClick={handleStart} disabled={!room || room.players.length < 2} style={{ marginBottom: 24 }}>
            Iniciar juego
          </button>
        )}
        {!isHost && <p style={{ opacity: 0.6, marginBottom: 24 }}>Esperando que el anfitrión inicie el juego...</p>}

        {/* Board selection */}
        {room && playerId && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Elige tu tablero</h3>
              <button onClick={() => setShowCreator(true)} style={{ fontSize: 13 }}>+ Crear tablero</button>
            </div>
            <BoardPicker
              availableBoards={room.availableBoards ?? []}
              myCustomBoards={myCustomBoards}
              selectedBoardId={selectedBoardId}
              playerId={playerId}
              players={room.players}
              onSelect={handleSelectBoard}
            />
          </div>
        )}
      </div>

      <div style={{ width: 280, flexShrink: 0, position: 'sticky', top: 16, height: 400 }}>
        <Chat />
      </div>

      {showCreator && (
        <BoardCreator
          onSaved={async () => {
            const { boards } = await getBoards()
            setMyCustomBoards(boards)
            setShowCreator(false)
          }}
          onCancel={() => setShowCreator(false)}
        />
      )}
    </div>
  )
}
