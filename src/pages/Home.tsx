import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { createRoom, joinRoom } from '../api/rooms'

type Mode = 'create' | 'join'

export default function Home() {
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState<Mode>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()
  const setIdentity = useGameStore((s) => s.setIdentity)

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { roomId, hostId } = await createRoom(name.trim())
      setIdentity({ playerId: hostId, playerName: name.trim(), isHost: true, roomId })
      navigate(`/lobby/${roomId}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!name.trim() || !roomCode.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { player, room } = await joinRoom(roomCode.trim().toUpperCase(), name.trim())
      setIdentity({
        playerId: player.id,
        playerName: name.trim(),
        isHost: false,
        roomId: room.roomId,
      })
      navigate(`/lobby/${room.roomId}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = mode === 'create' ? handleCreate : handleJoin
  const canSubmit = !loading && !!name.trim() && (mode === 'create' || !!roomCode.trim())

  return (
    <div>
      <h1>Lotería</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        maxLength={24}
      />

      <div>
        <button onClick={() => setMode('create')} disabled={mode === 'create'}>
          Crear sala
        </button>
        <button onClick={() => setMode('join')} disabled={mode === 'join'}>
          Unirse a sala
        </button>
      </div>

      {mode === 'join' && (
        <input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="Código de sala (ej. A3F9K2)"
          maxLength={6}
        />
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={handleSubmit} disabled={!canSubmit}>
        {loading ? 'Cargando...' : mode === 'create' ? 'Crear sala' : 'Unirse'}
      </button>
    </div>
  )
}
