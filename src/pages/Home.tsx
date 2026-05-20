import { useState, useEffect, useRef } from 'react'
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

const DECORATIVE = [
  { id: '01', cls: 'absolute left-[3%] top-[10%] w-20 rotate-[-18deg] opacity-[0.08]' },
  { id: '33', cls: 'absolute right-[4%] top-[8%] w-24 rotate-[14deg] opacity-[0.08]' },
  { id: '16', cls: 'absolute left-[17%] top-[22%] w-14 rotate-[7deg] opacity-[0.05]' },
  { id: '38', cls: 'absolute right-[16%] top-[24%] w-14 rotate-[-11deg] opacity-[0.05]' },
  { id: '04', cls: 'absolute left-[2%] bottom-[12%] w-20 rotate-[16deg] opacity-[0.08]' },
  { id: '47', cls: 'absolute right-[3%] bottom-[10%] w-24 rotate-[-14deg] opacity-[0.08]' },
  { id: '22', cls: 'absolute left-[21%] bottom-[6%] w-16 rotate-[-7deg] opacity-[0.06]' },
  { id: '10', cls: 'absolute right-[19%] bottom-[8%] w-16 rotate-[9deg] opacity-[0.06]' },
  { id: '52', cls: 'absolute left-[43%] bottom-[2%] w-12 rotate-[4deg] opacity-[0.04]' },
  { id: '27', cls: 'absolute right-[41%] bottom-[4%] w-12 rotate-[-4deg] opacity-[0.04]' },
]

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
  const [showJoin, setShowJoin] = useState(false)

  const boardsRef = useRef<HTMLDivElement>(null)

  const [token, setTokenState] = useState<TokenType>(() =>
    (localStorage.getItem('loteria-token') as TokenType | null) ?? 'bean'
  )
  const handleToken = (t: TokenType) => { setTokenState(t); localStorage.setItem('loteria-token', t) }

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
    } catch { } finally { setDeletingId(null) }
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
    <div className="bg-th min-h-screen">

      {/* Minimal top-right nav */}
      <div className="fixed top-0 right-0 p-5 flex items-center gap-5 z-30">
        {balance !== undefined && (
          <div className="text-right">
            <p className="text-[10px] text-th-sub uppercase tracking-widest">Monedas</p>
            <p className="text-base font-bold text-th-accent">{balance}</p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm text-th-sub hover:text-th transition-colors"
        >
          Salir
        </button>
      </div>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pb-8">

        {/* Scattered decorative card images */}
        {DECORATIVE.map((d) => (
          <img
            key={d.id}
            src={`/cards/${d.id.padStart(2, '0')}.jpg`}
            alt=""
            className={`${d.cls} rounded-lg pointer-events-none select-none`}
          />
        ))}

        {/* Radial vignette so center text is always readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 55% 60% at 50% 50%, var(--th-bg) 30%, transparent 100%)' }}
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-5 w-full max-w-xs">

          {/* Card fan icon */}
          <div className="relative w-32 h-40">
            <div className="absolute bottom-0 left-0 w-20 h-28 rounded-lg overflow-hidden shadow-lg rotate-[-14deg] origin-bottom opacity-75">
              <img src="/cards/33.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-20 h-28 rounded-lg overflow-hidden shadow-lg rotate-[14deg] origin-bottom opacity-75">
              <img src="/cards/04.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[5.5rem] h-32 rounded-lg overflow-hidden shadow-2xl z-10 ring-2 ring-th-accent/40">
              <img src="/cards/27.jpg" alt="" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-th leading-none">
              LOTERÍA
            </h1>
            <p className="text-th-sub text-sm mt-2 tracking-wide">El juego tradicional mexicano</p>
          </div>

          {/* Greeting */}
          {displayName && (
            <p className="text-th-sub text-sm">
              Hola, <span className="font-bold text-th">{displayName}</span>
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="w-full px-4 py-2.5 bg-red-900/30 border border-red-700/40 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Primary CTA */}
          <button
            onClick={handleCreate}
            disabled={loading || !displayName}
            className="flex items-center justify-center gap-3 w-full py-4 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-black/30 active:scale-[0.98]"
          >
            <span className="opacity-60 text-base font-bold">»»</span>
            {loading ? 'Creando...' : 'Crear sala'}
          </button>

          {/* Secondary pill buttons */}
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={() => { setShowJoin(v => !v); setError(null); setPreviewRoom(null) }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                showJoin
                  ? 'bg-th-accent text-white shadow-md'
                  : 'bg-th-ui hover:bg-th-ui-hover text-th'
              }`}
            >
              <span>👥</span> Unirse a sala
            </button>
            <button
              onClick={() => boardsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-5 py-2.5 bg-th-ui hover:bg-th-ui-hover text-th rounded-full text-sm font-semibold transition-colors"
            >
              <span>🎴</span> Mis tableros
            </button>
          </div>

          {/* Join flow — expands inline */}
          {showJoin && (
            <div className="w-full space-y-3 pt-1">
              <div className="flex gap-2">
                <input
                  value={roomCode}
                  onChange={e => { setRoomCode(e.target.value.toUpperCase()); setPreviewRoom(null) }}
                  placeholder="Código de sala"
                  maxLength={6}
                  className="flex-1 font-mono tracking-widest uppercase text-center text-sm"
                  autoFocus
                />
                <button
                  onClick={handlePreviewRoom}
                  disabled={previewLoading || !roomCode.trim()}
                  className="px-4 py-2 bg-th-ui hover:bg-th-ui-hover disabled:opacity-40 text-th font-semibold rounded-lg text-sm transition-colors shrink-0"
                >
                  {previewLoading ? '···' : 'Buscar'}
                </button>
              </div>
              {previewRoom && (
                <div className="px-4 py-3 bg-th-surface rounded-xl border border-th text-left space-y-2">
                  <div>
                    <p className="font-semibold text-th text-sm">
                      Sala <span className="font-mono text-th-accent">{previewRoom.roomId}</span>
                    </p>
                    <p className="text-th-sub text-xs mt-0.5">
                      {previewRoom.players.length}/{previewRoom.maxPlayers} jugadores · {previewRoom.entryFee} monedas/tablero
                    </p>
                  </div>
                  <button
                    onClick={handleJoin}
                    disabled={loading || !displayName}
                    className="w-full py-2.5 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    {loading ? 'Uniéndose...' : 'Unirse'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* ── Below fold: boards + customization ─────────────────── */}
      <div ref={boardsRef} className="max-w-3xl mx-auto px-4 pb-16 space-y-5">

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-th" />
          <span className="text-xs text-th-sub uppercase tracking-widest px-2">Tu perfil</span>
          <div className="flex-1 h-px bg-th" />
        </div>

        {/* My boards */}
        <div className="bg-th-surface rounded-2xl border border-th p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-th">Mis tableros</h2>
              <p className="text-xs text-th-sub mt-0.5">Personalizados · +10 monedas al usarlos</p>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-th-accent hover:bg-th-accent2 text-white text-sm font-bold rounded-lg transition-colors"
            >
              + Crear
            </button>
          </div>
          {customBoards.length === 0 ? (
            <p className="text-th-sub text-sm text-center py-5">Aún no tienes tableros personalizados.</p>
          ) : (
            <ul className="divide-y divide-th">
              {customBoards.map(b => (
                <li key={b.id} className="flex items-center justify-between py-3">
                  <span className="font-medium text-th text-sm">{b.name}</span>
                  <button
                    onClick={() => handleDeleteBoard(b.id)}
                    disabled={deletingId === b.id}
                    className="text-sm text-th-sub hover:text-red-400 disabled:opacity-40 transition-colors"
                  >
                    {deletingId === b.id ? '···' : 'Eliminar'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Customization */}
        <div className="bg-th-surface rounded-2xl border border-th p-6">
          <h2 className="text-base font-bold text-th mb-5">Personalización</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-th-sub uppercase tracking-wide mb-3">Token de juego</p>
              <TokenSelector value={token} onChange={handleToken} />
            </div>
            <ThemeSelector />
          </div>
        </div>

      </div>

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
