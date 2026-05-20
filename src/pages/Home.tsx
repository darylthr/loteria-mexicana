import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import { createRoom, joinRoom, fetchRoom } from '../api/rooms'
import { getProfile } from '../api/profile'
import { getBoards, deleteBoard } from '../api/boards'
import type { CustomBoard } from '../api/boards'
import BoardCreator from '../components/BoardCreator'
import type { GameRoom } from '../types/game'

export default function Home() {
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [roomCode, setRoomCode] = useState('')
  const [previewRoom, setPreviewRoom] = useState<GameRoom | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [customBoards, setCustomBoards] = useState<CustomBoard[]>([])
  const [showCreator, setShowCreator] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
    getBoards().then(({ boards }) => setCustomBoards(boards)).catch(() => {})
  }, [])

  const handleDeleteBoard = async (boardId: string) => {
    setDeletingId(boardId)
    try {
      await deleteBoard(boardId)
      setCustomBoards(prev => prev.filter(b => b.id !== boardId))
    } catch {
      // silently ignore
    } finally {
      setDeletingId(null)
    }
  }

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
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-amber-600 tracking-tight">Lotería</h1>
            {displayName && (
              <p className="text-sm text-stone-500">
                Hola, <span className="font-semibold text-stone-700">{displayName}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {balance !== undefined && (
              <div className="text-right">
                <p className="text-xs text-stone-400 uppercase tracking-wide">Monedas</p>
                <p className="text-lg font-bold text-amber-600">{balance}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create room */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-lg font-bold text-stone-800 mb-1">Nueva sala</h2>
            <p className="text-sm text-stone-500 mb-5">
              Crea una sala y comparte el código con tus amigos.
            </p>
            <button
              onClick={handleCreate}
              disabled={loading || !displayName}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Creando...' : 'Crear sala'}
            </button>
          </div>

          {/* Join room */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
            <h2 className="text-lg font-bold text-stone-800 mb-1">Unirse a sala</h2>
            <p className="text-sm text-stone-500 mb-4">Ingresa el código de sala de tu amigo.</p>
            <div className="flex gap-2 mb-3">
              <input
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value.toUpperCase())
                  setPreviewRoom(null)
                }}
                placeholder="Código (ej. A3F9K2)"
                maxLength={6}
                className="font-mono tracking-widest uppercase"
              />
              <button
                onClick={handlePreviewRoom}
                disabled={previewLoading || !roomCode.trim()}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed text-stone-700 font-semibold rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                {previewLoading ? '...' : 'Buscar'}
              </button>
            </div>

            {previewRoom && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                <p className="font-semibold text-stone-800">
                  Sala <span className="font-mono text-amber-700">{previewRoom.roomId}</span>
                </p>
                <p className="text-stone-600 mt-0.5">
                  {previewRoom.players.length}/{previewRoom.maxPlayers} jugadores ·{' '}
                  {previewRoom.entryFee} monedas por tablero
                </p>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={loading || !displayName || !previewRoom}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Uniéndose...' : 'Unirse'}
            </button>
          </div>
        </div>

        {/* My boards */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-800">Mis tableros</h2>
              <p className="text-sm text-stone-500">Tableros personalizados (+10 monedas al usarlos)</p>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              + Crear
            </button>
          </div>

          {customBoards.length === 0 ? (
            <p className="text-stone-400 text-sm text-center py-6">
              Aún no tienes tableros personalizados.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {customBoards.map(b => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <span className="font-medium text-stone-800">{b.name}</span>
                  <button
                    onClick={() => handleDeleteBoard(b.id)}
                    disabled={deletingId === b.id}
                    className="text-sm text-stone-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === b.id ? '...' : 'Eliminar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {showCreator && (
        <BoardCreator
          onSaved={async () => {
            const { boards } = await getBoards()
            setCustomBoards(boards)
            setShowCreator(false)
          }}
          onCancel={() => setShowCreator(false)}
        />
      )}
    </div>
  )
}
