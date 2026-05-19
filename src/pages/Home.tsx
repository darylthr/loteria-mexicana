import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import { createRoom, joinRoom, fetchRoom } from '../api/rooms'
import { getProfile } from '../api/profile'
import type { GameRoom } from '../types/game'

export default function Home() {
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [roomCode, setRoomCode] = useState('')
  const [previewRoom, setPreviewRoom] = useState<GameRoom | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const navigate = useNavigate()
  const playerId = useGameStore((s) => s.playerId)
  const balance = useGameStore((s) => s.balance)
  const setIdentity = useGameStore((s) => s.setIdentity)
  const setBalance = useGameStore((s) => s.setBalance)
  const setMyBoards = useGameStore((s) => s.setMyBoards)
  const signOut = useGameStore((s) => s.signOut)

  useEffect(() => {
    getProfile()
      .then(({ displayName, balance }) => {
        setDisplayName(displayName)
        setBalance(balance)
      })
      .catch(() => setError('Error al cargar el perfil'))
  }, [])

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const { roomId, hostId, room } = await createRoom()
      const hostPlayer = room.players.find(p => p.id === hostId)
      setIdentity({ playerId: playerId!, playerName: displayName, isHost: true, roomId })
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
    if (!previewRoom) return
    setLoading(true)
    setError(null)
    try {
      const { player, room } = await joinRoom(previewRoom.roomId)
      setIdentity({ playerId: playerId!, playerName: displayName, isHost: false, roomId: room.roomId })
      setBalance(player.balance)
      setMyBoards(player.boards)
      navigate(`/lobby/${room.roomId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    signOut()
    navigate('/auth')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>Lotería</h1>
        <button onClick={handleSignOut} style={{ fontSize: 13 }}>Cerrar sesión</button>
      </div>

      {displayName && (
        <p style={{ marginTop: 0, opacity: 0.7 }}>
          Hola, <strong>{displayName}</strong> · Monedas: <strong>{balance}</strong>
        </p>
      )}

      {/* ── Create ── */}
      <section>
        <h3 style={{ margin: '0 0 8px' }}>Nueva sala</h3>
        <p style={{ margin: '0 0 8px', opacity: 0.7, fontSize: 14 }}>
          Configura el costo y tableros en el lobby.
        </p>
        {error && !previewRoom && <p style={{ color: 'red' }}>{error}</p>}
        <button onClick={handleCreate} disabled={loading || !displayName}>
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
            </p>
          </div>
        )}

        {error && previewRoom && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
        <button
          onClick={handleJoin}
          disabled={loading || !displayName || !previewRoom}
          style={{ marginTop: 12 }}
        >
          {loading ? 'Uniéndose...' : 'Unirse'}
        </button>
      </section>
    </div>
  )
}
