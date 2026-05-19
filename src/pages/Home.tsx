import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { createRoom, joinRoom, fetchRoom } from '../api/rooms'
import type { GameRoom } from '../types/game'

type Mode = 'create' | 'join'

export default function Home() {
  const [name, setName] = useState('')
  const [mode, setMode] = useState<Mode>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create options
  const [entryFee, setEntryFee] = useState(50)
  const [createBoards, setCreateBoards] = useState(1)

  // Join options
  const [roomCode, setRoomCode] = useState('')
  const [previewRoom, setPreviewRoom] = useState<GameRoom | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [joinBoards, setJoinBoards] = useState(1)

  const navigate = useNavigate()
  const setIdentity = useGameStore((s) => s.setIdentity)
  const setBalance = useGameStore((s) => s.setBalance)
  const setMyBoards = useGameStore((s) => s.setMyBoards)

  const balance = useGameStore((s) => s.balance)

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

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { roomId, hostId, room } = await createRoom(name.trim(), entryFee, createBoards)
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

  const handleJoin = async () => {
    if (!name.trim() || !previewRoom) return
    setLoading(true)
    setError(null)
    try {
      const { player, room } = await joinRoom(previewRoom.roomId, name.trim(), joinBoards)
      setIdentity({
        playerId: player.id,
        playerName: name.trim(),
        isHost: false,
        roomId: room.roomId,
      })
      setBalance(player.balance)
      setMyBoards(player.boards)
      navigate(`/lobby/${room.roomId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const canCreate = !loading && !!name.trim()
  const canJoin = !loading && !!name.trim() && !!previewRoom

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
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setMode('create')} disabled={mode === 'create'}>Crear sala</button>
        <button onClick={() => setMode('join')} disabled={mode === 'join'} style={{ marginLeft: 8 }}>
          Unirse a sala
        </button>
      </div>

      {mode === 'create' && (
        <div style={{ marginTop: 16 }}>
          <label style={{ display: 'block' }}>
            Costo por tablero (monedas)
            <br />
            <input
              type="number"
              min={0}
              max={500}
              value={entryFee}
              onChange={(e) => setEntryFee(Number(e.target.value))}
              style={{ marginTop: 4 }}
            />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            Mis tableros
            <br />
            <button onClick={() => setCreateBoards(1)} disabled={createBoards === 1}>1</button>
            <button onClick={() => setCreateBoards(2)} disabled={createBoards === 2} style={{ marginLeft: 8 }}>2</button>
          </label>
          {entryFee > 0 && (
            <p style={{ opacity: 0.7, fontSize: 14 }}>
              Costo total: {entryFee * createBoards} monedas
            </p>
          )}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={handleCreate} disabled={!canCreate} style={{ marginTop: 12 }}>
            {loading ? 'Creando...' : 'Crear sala'}
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase())
                setPreviewRoom(null)
              }}
              placeholder="Código de sala (ej. A3F9K2)"
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
              <p style={{ margin: '4px 0' }}>
                Costo por tablero: <strong>{previewRoom.entryFee} monedas</strong>
              </p>
              <label style={{ display: 'block', marginTop: 8 }}>
                Mis tableros
                <br />
                <button onClick={() => setJoinBoards(1)} disabled={joinBoards === 1}>1</button>
                <button onClick={() => setJoinBoards(2)} disabled={joinBoards === 2} style={{ marginLeft: 8 }}>2</button>
              </label>
              <p style={{ opacity: 0.7, fontSize: 14 }}>
                Costo total: {previewRoom.entryFee * joinBoards} monedas
              </p>
            </div>
          )}

          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button onClick={handleJoin} disabled={!canJoin} style={{ marginTop: 12 }}>
            {loading ? 'Uniéndose...' : 'Unirse'}
          </button>
        </div>
      )}
    </div>
  )
}
