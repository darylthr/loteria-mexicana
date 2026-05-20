import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import { createRoom, joinRoom, fetchRoom } from '../api/rooms'
import { getProfile } from '../api/profile'
import { getBoards, deleteBoard } from '../api/boards'
import type { CustomBoard } from '../api/boards'
import BoardCreator from '../components/BoardCreator'
import ThemeSelector from '../components/ThemeSelector'
import { TokenSelector } from '../components/TokenMarker'
import type { TokenType } from '../components/TokenMarker'
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

  const [token, setTokenState] = useState<TokenType>(() =>
    (localStorage.getItem('loteria-token') as TokenType | null) ?? 'bean'
  )
  const handleToken = (t: TokenType) => {
    setTokenState(t)
    localStorage.setItem('loteria-token', t)
  }

  const navigate = useNavigate()
  const playerId = useGameStore((s) => s.playerId)
  const balance = useGameStore((s) => s.balance)
  const setIdentity = useGameStore((s) => s.setIdentity)
  const setBalance = useGameStore((s) => s.setBalance)
  const setMyBoards = useGameStore((s) => s.setMyBoards)
  const signOut = useGameStore((s) => s.signOut)

  useEffect(() => {
    getProfile()
      .then(({ displayName, balance }) => { setDisplayName(displayName); setBalance(balance) })
      .catch(() => setError('Error al cargar el perfil'))
    getBoards().then(({ boards }) => setCustomBoards(boards)).catch(() => {})
  }, [])

  const handleDeleteBoard = async (boardId: string) => {
    setDeletingId(boardId)
    try {
      await deleteBoard(boardId)
      setCustomBoards(prev => prev.filter(b => b.id !== boardId))
    } catch { /* ignore */ } finally { setDeletingId(null) }
  }

  const handleCreate = async () => {
    setLoading(true); setError(null)
    try {
      const { roomId, hostId, room } = await createRoom()
      const hostPlayer = room.players.find(p => p.id === hostId)
      setIdentity({ playerId: playerId!, playerName: displayName, isHost: true, roomId })
      if (hostPlayer) { setBalance(hostPlayer.balance); setMyBoards(hostPlayer.boards) }
      navigate(`/lobby/${roomId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setLoading(false) }
  }

  const handlePreviewRoom = async () => {
    const code = roomCode.trim().toUpperCase()
    if (!code) return
    setPreviewLoading(true); setError(null)
    try {
      const { room } = await fetchRoom(code)
      setPreviewRoom(room)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sala no encontrada')
      setPreviewRoom(null)
    } finally { setPreviewLoading(false) }
  }

  const handleJoin = async () => {
    if (!previewRoom) return
    setLoading(true); setError(null)
    try {
      const { player, room } = await joinRoom(previewRoom.roomId)
      setIdentity({ playerId: playerId!, playerName: displayName, isHost: false, roomId: room.roomId })
      setBalance(player.balance)
      setMyBoards(player.boards)
      navigate(`/lobby/${room.roomId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally { setLoading(false) }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    signOut()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-th">
      {/* Header */}
      <header className="bg-th-surface border-b border-th px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-th-accent tracking-tight">Lotería</h1>
          {displayName && (
            <p className="text-sm text-stone-400">
              Hola, <span className="font-semibold text-stone-200">{displayName}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-5">
          {balance !== undefined && (
            <div className="text-right">
              <p className="text-[10px] text-stone-500 uppercase tracking-wide">Monedas</p>
              <p className="text-lg font-bold text-th-accent">{balance}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 text-sm text-stone-400 hover:text-stone-100 hover:bg-th-surface rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="px-4 py-3 bg-red-900/40 border border-red-700 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Create + Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-th-surface rounded-2xl border border-th p-6">
            <h2 className="text-lg font-bold text-stone-100 mb-1">Nueva sala</h2>
            <p className="text-sm text-stone-500 mb-5">Crea una sala y comparte el código.</p>
            <button
              onClick={handleCreate}
              disabled={loading || !displayName}
              className="w-full py-2.5 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              {loading ? 'Creando...' : 'Crear sala'}
            </button>
          </div>

          <div className="bg-th-surface rounded-2xl border border-th p-6">
            <h2 className="text-lg font-bold text-stone-100 mb-1">Unirse a sala</h2>
            <p className="text-sm text-stone-500 mb-4">Ingresa el código de tu amigo.</p>
            <div className="flex gap-2 mb-3">
              <input
                value={roomCode}
                onChange={e => { setRoomCode(e.target.value.toUpperCase()); setPreviewRoom(null) }}
                placeholder="Código (ej. A3F9K2)"
                maxLength={6}
                className="font-mono tracking-widest uppercase"
              />
              <button
                onClick={handlePreviewRoom}
                disabled={previewLoading || !roomCode.trim()}
                className="px-4 py-2 bg-stone-700 hover:bg-stone-600 disabled:opacity-40 text-stone-100 font-semibold rounded-lg text-sm transition-colors whitespace-nowrap"
              >
                {previewLoading ? '...' : 'Buscar'}
              </button>
            </div>
            {previewRoom && (
              <div className="mb-3 px-3 py-2.5 bg-th rounded-xl border border-th text-sm">
                <p className="font-semibold text-stone-100">
                  Sala <span className="font-mono text-th-accent">{previewRoom.roomId}</span>
                </p>
                <p className="text-stone-400 mt-0.5">
                  {previewRoom.players.length}/{previewRoom.maxPlayers} jugadores · {previewRoom.entryFee} monedas/tablero
                </p>
              </div>
            )}
            <button
              onClick={handleJoin}
              disabled={loading || !displayName || !previewRoom}
              className="w-full py-2.5 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              {loading ? 'Uniéndose...' : 'Unirse'}
            </button>
          </div>
        </div>

        {/* My boards */}
        <div className="bg-th-surface rounded-2xl border border-th p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-100">Mis tableros</h2>
              <p className="text-sm text-stone-500">Personalizados · +10 monedas al usarlos</p>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-th-accent hover:bg-th-accent2 text-white text-sm font-bold rounded-lg transition-colors"
            >
              + Crear
            </button>
          </div>
          {customBoards.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-6">Aún no tienes tableros personalizados.</p>
          ) : (
            <ul className="divide-y divide-th">
              {customBoards.map(b => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <span className="font-medium text-stone-200">{b.name}</span>
                  <button
                    onClick={() => handleDeleteBoard(b.id)}
                    disabled={deletingId === b.id}
                    className="text-sm text-stone-500 hover:text-red-400 disabled:opacity-40 transition-colors"
                  >
                    {deletingId === b.id ? '...' : 'Eliminar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Customization */}
        <div className="bg-th-surface rounded-2xl border border-th p-6">
          <h2 className="text-lg font-bold text-stone-100 mb-5">Personalización</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Token */}
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-3">Token de juego</p>
              <p className="text-xs text-stone-500 mb-3">El objeto que aparece en tus cartas marcadas.</p>
              <TokenSelector value={token} onChange={handleToken} />
            </div>
            {/* Theme */}
            <ThemeSelector />
          </div>
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
