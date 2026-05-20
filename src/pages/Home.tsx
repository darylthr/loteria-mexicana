import { useState, useEffect, useRef } from 'react'
import { useBackgroundMusic } from '../hooks/useBackgroundMusic'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronsRight, Users, Layers, Plus, LayoutGrid, Volume2, VolumeX, CheckSquare, Trophy, Minus, Square, Maximize2, Sparkles, Coins } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useGameStore } from '../store/gameStore'
import { createRoom, joinRoom, fetchRoom } from '../api/rooms'
import { getProfile } from '../api/profile'
import { getBoards, deleteBoard } from '../api/boards'
import type { CustomBoard } from '../api/boards'
import BoardCreator from '../components/BoardCreator'
import FadeIn from '../components/FadeIn'
import HeroLogo from '../components/HeroLogo'
import GameLoader from '../components/GameLoader'
import ThemeSelector from '../components/ThemeSelector'
import { TokenSelector } from '../components/TokenMarker'
import type { TokenType } from '../components/TokenMarker'
import type { GameRoom } from '../types/game'


function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px border-t border-th" />
      <span className="text-xs font-bold text-th-sub uppercase tracking-widest px-1">{label}</span>
      <div className="flex-1 h-px border-t border-th" />
    </div>
  )
}

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

  const [nickname, setNickname] = useState('')
  const { muted, volume, toggleMute, setVolume } = useBackgroundMusic('/sounds/bg-music.mp3')
  const [showVolume, setShowVolume] = useState(false)

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
    } catch { } finally { setDeletingId(null) }
  }

  const handleCreate = async () => {
    setLoading(true); setError(null)
    try {
      const { roomId, hostId, room } = await createRoom(nickname.trim() || undefined)
      const hostPlayer = room.players.find(p => p.id === hostId)
      setIdentity({ playerId: playerId!, playerName: nickname.trim() || displayName, isHost: true, roomId })
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
      const { player, room } = await joinRoom(previewRoom.roomId, nickname.trim() || undefined)
      setIdentity({ playerId: playerId!, playerName: nickname.trim() || displayName, isHost: false, roomId: room.roomId })
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

  if (loading) {
    return (
      <div className="h-screen bg-th flex items-center justify-center">
        <GameLoader message={previewRoom ? 'Uniéndose a la sala…' : 'Creando sala…'} />
      </div>
    )
  }

  return (
    <div className="bg-th min-h-screen">

      {/* Minimal top-right nav */}
      <div className="absolute top-0 w-full p-8 flex justify-between z-30">
        <div
          className="relative flex items-center gap-2"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <button
            onClick={toggleMute}
            className="text-th-sub hover:text-th transition-colors"
            aria-label={muted ? 'Activar sonido' : 'Silenciar'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          {showVolume && (
            <div className="flex items-center bg-th-surface border border-th rounded-full px-3 py-1.5 shadow-lg">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="w-20"
              />
            </div>
          )}
        </div>
        <div className='flex flex-wrap items-center gap-6'>
          {balance !== undefined && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 bg-th-accent/10 rounded-full border border-th-accent/20"
              style={{ animation: 'balancePulse 3s ease-in-out infinite' }}
            >
              <Coins className="w-5 h-5 text-th-accent" />
              <span className="font-black text-th-accent text-lg font-ui">{balance}</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="text-lg text-th-sub hover:text-th transition-colors flex items-center px-3 py-1.5"
          >
            <LogOut className="w-5 h-5 opacity-60" />
          </button>
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pb-8">

        {/* Background image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/images/bg/bg.png)',
            backgroundSize: 'auto 40%',
            backgroundPosition: 'bottom',
            backgroundRepeat: 'no-repeat',
            opacity: 0.18,
          }}
        />

        {/* Vignette to keep center content readable */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, transparent 20%, var(--th-bg) 80%)' }}
        />

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-5 w-full max-w-xs">

          {/* Logo & Title */}
          <div className='flex flex-wrap justify-center'>

            {/* Three-card display */}
            <div style={{ animation: 'fadeSlideUp 0.6s ease both' }}>
              <HeroLogo/>
            </div>

            {/* Title */}
            <div className="mt-12 mb-20" style={{ animation: 'fadeSlideUp 0.6s ease 0.12s both' }}>
              <div className='flex flex-wrap items-end justify-center'>
                <h1 className="text-6xl font-black fon -display text-th leading-none">
                  LOTER
                </h1>
                <h2 className="text-6xl font-black text-red-400 leading-none">.io</h2>
              </div>
              <p className="text-th-sub text-xl mt-2 tracking-wide">La loteria tradicional mexicana.</p>
            </div>

          </div>

          {/* Nickname */}
          <div className="w-full" style={{ animation: 'fadeSlideUp 0.6s ease 0.22s both' }}>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Apodo..."
              maxLength={20}
              className="text-left text-lg font-bold py-4 rounded-xl"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="w-full px-4 py-2.5 bg-red-900/30 border border-red-700/40 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Primary CTA */}
          <button
            onClick={handleCreate}
            disabled={loading || !displayName}
            className="relative flex items-center justify-center gap-3 w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xl rounded-xl transition-all shadow-xl shadow-black/30 active:scale-[0.98] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(0,0,0,0.08)), var(--th-accent)', animation: 'fadeSlideUp 0.6s ease 0.32s both' }}
          >
            <ChevronsRight
              className="w-5 h-5 shrink-0"
              style={{ animation: 'chevronMarch 1.2s ease-in-out infinite' }}
            />
            {loading ? 'Creando...' : 'Crear sala'}
          </button>

          {/* Secondary pill buttons */}
          <div className="flex gap-3 flex-wrap w-full justify-between" style={{ animation: 'fadeSlideUp 0.6s ease 0.42s both' }}>
            <button
              onClick={() => { setShowJoin(v => !v); setError(null); setPreviewRoom(null) }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                showJoin
                  ? 'bg-th-accent text-white shadow-md'
                  : 'bg-th-ui hover:bg-th-ui-hover text-th'
              }`}
            >
              <Users className="w-4 h-4" /> Unirse a sala
            </button>
            <button
              onClick={() => boardsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-5 py-2.5 bg-th-ui hover:bg-th-ui-hover text-th rounded-lg text-sm font-semibold transition-colors"
            >
              <Layers className="w-4 h-4" /> Mis tableros
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
                <div className="px-4 py-3 bg-th-surface rounded-lg border border-th text-left space-y-2">
                  <div>
                    <p className="font-semibold text-th text-sm">
                      Sala <span className="font-mono font-ui text-th-accent">{previewRoom.roomId}</span>
                    </p>
                    <p className="text-th-sub text-xs mt-0.5">
                      {previewRoom.players.length}/{previewRoom.maxPlayers} jugadores · {previewRoom.entryFee} monedas/tablero
                    </p>
                  </div>
                  <button
                    onClick={handleJoin}
                    disabled={loading || !displayName}
                    className="w-full py-2.5 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    {loading ? 'Uniéndose...' : 'Unirse'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
        
      </section>

      {/* ── Mis tableros ───────────────────────────────────────── */}
      <div ref={boardsRef} className="max-w-3xl mx-auto px-4 pt-4 pb-6">
        <FadeIn><SectionDivider label="Mis tableros" /></FadeIn>
        <FadeIn delay={0.08} className="bg-th-surface rounded-xl border border-th p-6 mt-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-th-sub">Tableros personalizados · +10 monedas al usarlos</p>
            <button
              onClick={() => setShowCreator(true)}
              className="px-4 py-2 bg-th-accent hover:bg-th-accent2 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Crear tablero
            </button>
          </div>
          {customBoards.length === 0 ? (
            <p className="text-th-sub text-sm text-center py-6">Aún no tienes tableros personalizados.</p>
          ) : (
            <ul className="divide-y divide-th">
              {customBoards.map(b => (
                <li key={b.id} className="flex items-center justify-between py-3 transition-colors hover:bg-th-accent/5 px-1 rounded">
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
        </FadeIn>
      </div>

      {/* ── Personalización ────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-6">
        <FadeIn><SectionDivider label="Personalización" /></FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <FadeIn delay={0.05} className="bg-th-surface rounded-xl border border-th p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20">
            <p className="text-xs font-bold text-th-sub uppercase tracking-widest mb-1">Token de juego</p>
            <p className="text-xs text-th-sub mb-4">El objeto que aparece en tus cartas marcadas.</p>
            <TokenSelector value={token} onChange={handleToken} />
          </FadeIn>
          <FadeIn delay={0.12} className="bg-th-surface rounded-xl border border-th p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20">
            <ThemeSelector />
          </FadeIn>
        </div>
      </div>

      {/* ── Cómo jugar ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <FadeIn><SectionDivider label="Cómo jugar" /></FadeIn>

        {/* Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {[
            { Icon: LayoutGrid,  step: '1', title: 'Elige tablero', desc: 'Selecciona hasta 2 tableros antes del juego. Los personalizados dan +10 monedas.' },
            { Icon: Volume2,     step: '2', title: 'Canillita canta', desc: 'El anfitrión saca cartas una por una y las muestra a todos los jugadores.' },
            { Icon: CheckSquare, step: '3', title: 'Marca tus cartas', desc: 'Toca las cartas de tu tablero conforme vayan apareciendo en pantalla.' },
            { Icon: Trophy,      step: '4', title: '¡Lotería!', desc: 'Completa un patrón y pulsa "¡Lotería!" para reclamar tu premio antes que los demás.' },
          ].map((s, i) => (
            <FadeIn key={s.step} delay={i * 0.08} className="bg-th-surface rounded-xl border border-th p-4 flex flex-col gap-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 hover:border-th-accent/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-th-accent/10 flex items-center justify-center shrink-0">
                  <s.Icon className="w-4 h-4 text-th-accent" />
                </div>
                <span className="text-[10px] font-black text-th-sub uppercase tracking-widest">Paso {s.step}</span>
              </div>
              <p className="font-bold text-th text-sm leading-tight">{s.title}</p>
              <p className="text-xs text-th-sub leading-relaxed">{s.desc}</p>
            </FadeIn>
          ))}
        </div>

        {/* Prize tiers */}
        <FadeIn delay={0.05} className="mt-4 bg-th-surface rounded-xl border border-th p-5">
          <p className="text-xs font-bold text-th-sub uppercase tracking-widest mb-4">Premios · % del bote acumulado</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { Icon: Minus,    label: 'Línea',   pct: '25 %',  desc: 'Fila, columna o diagonal completa' },
              { Icon: Square,   label: 'Cuadro',  pct: '35 %',  desc: 'Bloque 2 × 2 en cualquier esquina' },
              { Icon: Maximize2,label: 'Esquinas',pct: '45 %',  desc: 'Las 4 esquinas del tablero' },
              { Icon: Sparkles, label: 'Lotería', pct: '55 %+', desc: 'Tablero completo — jackpot' },
            ].map(p => (
              <div key={p.label} className="flex flex-col gap-1 px-3 py-3 rounded-lg bg-th border border-th transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-black/20 hover:border-th-accent/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <p.Icon className="w-3.5 h-3.5 text-th-accent" />
                    <span className="font-bold text-th text-sm">{p.label}</span>
                  </div>
                  <span className="font-black text-th-accent text-sm font-ui">{p.pct}</span>
                </div>
                <p className="text-xs text-th-sub leading-snug">{p.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <FadeIn>
      <footer className="border-t border-th px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-th-sub">
        <p>desarrollado por <span className="font-semibold text-th">daryl</span> &amp; <span className="font-semibold text-th">shemita</span></p>

        <div className="flex items-center gap-5">
          <a href="/terms" className="hover:text-th transition-colors">Términos</a>
          <a href="/privacy" className="hover:text-th transition-colors">Privacidad</a>
          <a href="/cookies" className="hover:text-th transition-colors">Cookies</a>
          <a
            href="https://discord.gg/EYbxB2wjy9"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-th transition-colors flex items-center gap-1.5"
            aria-label="Discord"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Discord
          </a>
        </div>
      </footer>
      </FadeIn>

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
