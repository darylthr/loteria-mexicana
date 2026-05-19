import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { createRoom, joinRoom, fetchRoom } from '../api/rooms'
import type { GameRoom } from '../types/game'

export default function Home() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [roomCode, setRoomCode] = useState('')
  const [previewRoom, setPreviewRoom] = useState<GameRoom | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const navigate = useNavigate()
  const setIdentity = useGameStore((s) => s.setIdentity)
  const setBalance = useGameStore((s) => s.setBalance)
  const setMyBoards = useGameStore((s) => s.setMyBoards)
  const balance = useGameStore((s) => s.balance)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { roomId, hostId, room } = await createRoom(name.trim())
      const hostPlayer = room.players.find(p => p.id === hostId)
      setIdentity({ playerId: hostId, playerName: name.trim(), isHost: true, roomId })
      if (hostPlayer) {
        setBalance(hostPlayer.balance)
        setMyBoards(hostPlayer.boards)
      }
      navigate(`/lobby/${roomId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewRoom = async () => {
    const code = roomCode.trim().toUpperCase()
    if (!code) return
    setPreviewLoading(true)
    setError(null)
    try {
      const { room } = await fetchRoom(code)
      setPreviewRoom(room)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sala no encontrada')
      setPreviewRoom(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim() || !previewRoom) return
    setLoading(true)
    setError(null)
    try {
      const { player, room } = await joinRoom(previewRoom.roomId, name.trim())
      setIdentity({ playerId: player.id, playerName: name.trim(), isHost: false, roomId: room.roomId })
      setBalance(player.balance)
      setMyBoards(player.boards)
      navigate(`/lobby/${room.roomId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Lotería</h1>

      {balance > 0 && (
        <p>Monedas: <strong>{balance}</strong></p>
      )}

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        maxLength={24}
        style={{ display: 'block', marginBottom: 24 }}
      />

      {/* ── Create ── */}
      <section>
        <h3 style={{ margin: '0 0 8px' }}>Nueva sala</h3>
        <p style={{ margin: '0 0 8px', opacity: 0.7, fontSize: 14 }}>
          Configura el costo y tableros en el lobby.
        </p>
        {error && !previewRoom && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={handleCreate} disabled={loading || !name.trim()}>
          {loading ? 'Creando...' : 'Crear sala'}
        </button>
      </section>

      <hr style={{ margin: '24px 0' }} />

      {/* ── Join ── */}
      <section>
        <h3 style={{ margin: '0 0 8px' }}>Unirse a sala</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={roomCode}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase())
              setPreviewRoom(null)
            }}
            placeholder="Código (ej. A3F9K2)"
            maxLength={6}
          />
          <button onClick={handlePreviewRoom} disabled={previewLoading || !roomCode.trim()}>
            {previewLoading ? '...' : 'Buscar'}
          </button>
        </div>

        {previewRoom && (
          <div style={{ marginTop: 12, padding: 12, border: '1px solid #ccc', borderRadius: 8 }}>
            <p style={{ margin: 0 }}>
              Sala <strong>{previewRoom.roomId}</strong> · {previewRoom.players.length}/{previewRoom.maxPlayers} jugadores
            </p>
            <p style={{ margin: '4px 0', fontSize: 14 }}>
              Costo por tablero: <strong>{previewRoom.entryFee} monedas</strong>
              {' · '}Tableros elegibles en el lobby
            </p>
          </div>
        )}

        {error && previewRoom && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
        <button
          onClick={handleJoin}
          disabled={loading || !name.trim() || !previewRoom}
          style={{ marginTop: 12 }}
        >
          {loading ? 'Uniéndose...' : 'Unirse'}
        </button>
      </section>
    </div>
  )
}
