import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

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

  // Local config state — controlled inputs for fee (host) and board count (all)
  const [feeInput, setFeeInput] = useState(0)
  const [numBoards, setNumBoards] = useState(1)
  const [configApplied, setConfigApplied] = useState(false)

  // Sync local state from room when it loads or updates
  useEffect(() => {
    if (!room) return
    setFeeInput(room.entryFee)
    const me = room.players.find(p => p.id === playerId)
    if (me) setNumBoards(me.boards.length)
  }, [room?.roomId]) // only on initial room load

  useEffect(() => {
    if (!playerId || !roomId) return

    const socket = initSocket()
    socket.emit('room:join', { roomId, playerId })

    socket.on('room:joined', ({ room, player }) => {
      setRoom(room)
      setMyBoards(player.boards)
      setBalance(player.balance)
      setFeeInput(room.entryFee)
      setNumBoards(player.boards.length)
      if (room.status === 'playing') navigate(`/game/${roomId}`)
    })

    socket.on('room:player_joined', ({ player }) => {
      addPlayer(player)
    })

    socket.on('room:updated', ({ room }) => {
      setRoom(room)
      const me = room.players.find(p => p.id === playerId)
      if (me) {
        setMyBoards(me.boards)
        setNumBoards(me.boards.length)
      }
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
      socket.off('game:started')
      socket.off('error')
    }
  }, [playerId, roomId])

  const handleApplyConfig = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return

    if (isHost) {
      socket.emit('room:configure', { roomId, playerId, entryFee: feeInput })
    }
    socket.emit('room:set_boards', { roomId, playerId, numBoards })
    setConfigApplied(true)
  }

  const handleStart = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:start', { roomId, playerId })
  }

  const myPlayer = room?.players.find(p => p.id === playerId)
  const estimatedCost = (room?.entryFee ?? feeInput) * numBoards
  const canAfford = balance >= estimatedCost

  return (
    <div>
      <h2>Sala: {roomId}</h2>
      <p style={{ opacity: 0.7, fontSize: 14 }}>
        Comparte este código con tus amigos para que se unan.
      </p>

      {/* ── Config panel ── */}
      <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 8, marginBottom: 16 }}>
        <h4 style={{ margin: '0 0 12px' }}>Configuración</h4>

        {isHost && (
          <label style={{ display: 'block', marginBottom: 12 }}>
            Costo por tablero (monedas)
            <br />
            <input
              type="number"
              min={0}
              max={500}
              value={feeInput}
              onChange={(e) => { setFeeInput(Number(e.target.value)); setConfigApplied(false) }}
              style={{ marginTop: 4 }}
            />
          </label>
        )}

        {!isHost && room && (
          <p style={{ margin: '0 0 12px', fontSize: 14 }}>
            Costo por tablero: <strong>{room.entryFee} monedas</strong>
          </p>
        )}

        <label style={{ display: 'block', marginBottom: 8 }}>
          Mis tableros
        </label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => { setNumBoards(1); setConfigApplied(false) }}
            disabled={numBoards === 1}
          >
            1 tablero
          </button>
          <button
            onClick={() => { setNumBoards(2); setConfigApplied(false) }}
            disabled={numBoards === 2}
          >
            2 tableros
          </button>
        </div>

        <p style={{ margin: '0 0 8px', fontSize: 14, color: canAfford ? undefined : 'red' }}>
          Costo total al iniciar: <strong>{estimatedCost} monedas</strong>
          {' '}(tienes {balance})
          {!canAfford && ' — monedas insuficientes'}
        </p>

        <button onClick={handleApplyConfig} disabled={configApplied}>
          {configApplied ? 'Configuración aplicada ✓' : 'Aplicar'}
        </button>
      </div>

      {/* ── Player list ── */}
      <h3>Jugadores ({room?.players.length ?? 0} / {room?.maxPlayers ?? 6})</h3>
      <ul>
        {room?.players.map((p) => (
          <li key={p.id}>
            {p.name}
            {p.id === room.hostId ? ' 👑' : ''}
            {p.id === playerId ? ' (tú)' : ''}
            {' '}— {p.boards.length} tablero{p.boards.length > 1 ? 's' : ''}
          </li>
        ))}
      </ul>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isHost && (
        <button
          onClick={handleStart}
          disabled={!room || room.players.length < 2}
        >
          Iniciar juego
        </button>
      )}

      {!isHost && <p>Esperando que el anfitrión inicie el juego...</p>}
    </div>
  )
}
