import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronsRight, Crown, Check, Star, X, Copy, Share2, Coins, Volume2, VolumeX, LogOut } from 'lucide-react'
import { useBackgroundMusic } from '../hooks/useBackgroundMusic'
import { useGameStore } from '../store/gameStore'
import { detectClaimableSlots, PRIZE_INFO, PRIZE_SLOT_ORDER } from '../utils/winDetection'
import PlayerBoard from '../components/PlayerBoard'
import CurrentCard from '../components/CurrentCard'
import DrawnCards from '../components/DrawnCards'
import WinnerOverlay from '../components/WinnerOverlay'
import Chat from '../components/Chat'
import type { TokenType } from '../components/TokenMarker'
import type { PrizeSlot } from '../types/game'

export default function Game() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const playerId = useGameStore((s) => s.playerId)
  const isHost = useGameStore((s) => s.isHost)
  const room = useGameStore((s) => s.room)
  const myBoards = useGameStore((s) => s.myBoards)
  const balance = useGameStore((s) => s.balance)
  const currentCard = useGameStore((s) => s.currentCard)
  const drawnCards = useGameStore((s) => s.drawnCards)
  const claimedPrizes = useGameStore((s) => s.claimedPrizes)
  const gameEnded = useGameStore((s) => s.gameEnded)
  const error = useGameStore((s) => s.error)

  const setError = useGameStore((s) => s.setError)
  const resetGame = useGameStore((s) => s.resetGame)
  const disconnectSocket = useGameStore((s) => s.disconnectSocket)

  const [token] = useState<TokenType>(() =>
    (localStorage.getItem('loteria-token') as TokenType | null) ?? 'bean'
  )
  const [copied, setCopied] = useState(false)
  const [showVolume, setShowVolume] = useState(false)
  const [flashedSlots, setFlashedSlots] = useState<Set<PrizeSlot>>(new Set())
  const prevClaimedRef = useRef<Partial<Record<PrizeSlot, unknown>>>({})
  const { muted, volume, toggleMute, setVolume } = useBackgroundMusic('/sounds/bg-music.mp3')

  const lastEmit = useRef<Record<string, number>>({})
  const debounced = (key: string, fn: () => void, ms = 600) => {
    const now = Date.now()
    if (now - (lastEmit.current[key] ?? 0) < ms) return
    lastEmit.current[key] = now
    fn()
  }

  useEffect(() => {
    if (!playerId || !roomId) { navigate('/'); return }
    if (!useGameStore.getState().socket) {
      const socket = useGameStore.getState().initSocket()
      socket.emit('room:join', { roomId })
    }
  }, [playerId, roomId, navigate])

  useEffect(() => {
    const socket = useGameStore.getState().socket
    if (!socket) return

    socket.on('game:card_drawn', ({ card }) => { useGameStore.getState().cardDrawn(card) })
    socket.on('game:card_marked', ({ playerId: markedBy, board }) => {
      if (markedBy === useGameStore.getState().playerId) useGameStore.getState().updateBoard(board)
    })
    socket.on('game:prize_claimed', ({ slot, room }) => {
      const claim = room.claimedPrizes[slot]
      if (claim) useGameStore.getState().setPrizeClaimed(slot, claim, room)
    })
    socket.on('game:ended', ({ room, reason }) => { useGameStore.getState().setGameEnded(reason, room) })
    socket.on('game:restarted', ({ room }) => { useGameStore.getState().resetForNewGame(room) })
    socket.on('error', ({ message }) => { useGameStore.getState().setError(message) })

    return () => {
      socket.off('game:card_drawn')
      socket.off('game:card_marked')
      socket.off('game:prize_claimed')
      socket.off('game:ended')
      socket.off('game:restarted')
      socket.off('error')
    }
  }, [])

  const drawnCardIds = useMemo(() => new Set(drawnCards.map((c) => c.id)), [drawnCards])
  const claimableSlots = useMemo(() => detectClaimableSlots(myBoards, claimedPrizes), [myBoards, claimedPrizes])
  const deckExhausted = room ? drawnCards.length >= room.deck.length : false

  // Flash prize buttons when newly claimed
  useEffect(() => {
    const prev = prevClaimedRef.current
    const newSlots = PRIZE_SLOT_ORDER.filter(s => claimedPrizes[s] && !prev[s])
    if (newSlots.length > 0) {
      setFlashedSlots(new Set(newSlots))
      setTimeout(() => setFlashedSlots(new Set()), 700)
    }
    prevClaimedRef.current = claimedPrizes
  }, [claimedPrizes])

  const handleDraw = () => {
    const s = useGameStore.getState().socket
    if (s && roomId) s.emit('game:draw', { roomId })
  }
  const handleMark = (cardId: number, boardIndex: number) => {
    debounced(`mark-${boardIndex}-${cardId}`, () => {
      const s = useGameStore.getState().socket
      if (s && roomId) s.emit('game:mark', { roomId, cardId, boardIndex })
    }, 400)
  }
  const handleLoteria = (slot: PrizeSlot) => {
    const s = useGameStore.getState().socket
    if (s && roomId) s.emit('game:loteria', { roomId, slot })
  }
  const handleNewGame = () => {
    const s = useGameStore.getState().socket
    if (s && roomId) s.emit('game:restart', { roomId })
  }
  const handleClose = () => { disconnectSocket(); resetGame(); navigate('/') }

  const prizeButtons = (colLayout: boolean) => PRIZE_SLOT_ORDER.map(slot => {
    const { label, pct } = PRIZE_INFO[slot]
    const claim = claimedPrizes[slot]
    const canClaim = claimableSlots.has(slot)
    const amount = Math.floor((room?.pot ?? 0) * pct / 100)
    const isMyWin = claim?.playerId === playerId
    return (
      <button
        key={slot}
        onClick={() => !claim && debounced(`loteria-${slot}`, () => handleLoteria(slot))}
        disabled={!!claim}
        style={flashedSlots.has(slot) ? { animation: 'claimFlash 0.65s ease both' } : undefined}
        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
          colLayout ? 'flex items-center justify-between w-full' : 'flex flex-col gap-0.5'
        } ${
          claim
            ? isMyWin
              ? 'bg-green-900/30 border border-green-700/40 text-green-400'
              : 'bg-th border border-th text-th-sub opacity-50'
            : canClaim
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-900/30 cursor-pointer'
              : 'bg-th-ui hover:bg-th-ui-hover border border-th text-th cursor-pointer'
        }`}
      >
        <span className="font-semibold">{label}</span>
        <span className={`font-normal ${colLayout ? 'opacity-80' : 'opacity-70 text-[10px]'}`}>
          {claim ? (isMyWin ? '¡Tú!' : claim.playerName) : `${amount} mon.`}
        </span>
      </button>
    )
  })

  return (
    <div className="h-screen flex flex-col bg-th overflow-hidden">
      {gameEnded && room && (
        <WinnerOverlay
          room={room}
          myPlayerId={playerId}
          reason={gameEnded.reason}
          isHost={isHost}
          onNewGame={handleNewGame}
          onClose={handleClose}
        />
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="shrink-0 bg-th-surface border-b border-th px-4 py-3 flex items-center justify-between" style={{ animation: 'fadeSlideUp 0.4s ease both' }}>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-th-accent font-display">LOTERÍA</h1>
          <span className="font-mono font-ui text-xs text-th-sub tracking-widest hidden sm:inline">{roomId}</span>
          <div
            className="relative flex items-center gap-2"
            onMouseEnter={() => setShowVolume(true)}
            onMouseLeave={() => setShowVolume(false)}
          >
            <button
              onClick={() => setShowVolume(v => !v)}
              className="text-th-sub hover:text-th transition-colors"
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            {showVolume && (
              <div className="absolute left-0 top-full mt-2 z-20 flex items-center gap-2 bg-th-surface border border-th rounded-xl px-3 py-2 shadow-lg">
                <button onClick={toggleMute} className="text-th-sub hover:text-th transition-colors shrink-0">
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.05} value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-24"
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {balance !== undefined && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 bg-th-accent/10 rounded-full border border-th-accent/20"
              style={{ animation: 'balancePulse 3s ease-in-out infinite' }}
            >
              <Coins className="w-4 h-4 text-th-accent" />
              <span className="font-black text-th-accent text-sm font-ui">{balance}</span>
            </div>
          )}
          <button onClick={handleClose} className="text-th-sub hover:text-th transition-colors" aria-label="Salir">
            <LogOut className="w-5 h-5 opacity-60" />
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on lg+)
      ══════════════════════════════════════════════════════ */}
      <div className="lg:hidden flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Current card strip + draw button */}
        <div className="shrink-0 bg-th-surface border-b border-th px-3 py-2 flex items-center gap-3">
          {currentCard ? (
            <img
              key={currentCard.id}
              src={currentCard.imageUrl}
              alt={currentCard.name}
              className="w-9 h-[52px] object-cover rounded shrink-0 ring-1 ring-th-accent"
              style={{ animation: 'cardFlipIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
            />
          ) : (
            <div className="w-9 h-[52px] rounded border border-dashed border-th shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-th-sub font-bold uppercase tracking-widest">Carta actual</p>
            <p className="text-sm font-black text-th truncate">{currentCard?.name ?? '—'}</p>
            <p className="text-[10px] text-th-sub">{drawnCards.length} sacada{drawnCards.length !== 1 ? 's' : ''}</p>
          </div>
          {isHost && (
            <button
              onClick={() => debounced('draw', handleDraw)}
              disabled={deckExhausted || room?.status !== 'playing'}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl transition-all active:scale-[0.97]"
            >
              <ChevronsRight className="w-4 h-4" style={{ animation: 'chevronMarch 1.2s ease-in-out infinite' }} />
              Sacar
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 flex flex-col gap-3">

            {/* Board(s) */}
            {myBoards.map((board) => (
              <div key={board.boardIndex} className="flex flex-col items-center">
                {myBoards.length > 1 && (
                  <p className="mb-1.5 text-xs font-bold text-th-sub uppercase tracking-widest">
                    Tablero {board.boardIndex + 1}
                  </p>
                )}
                <PlayerBoard
                  board={board}
                  drawnCardIds={drawnCardIds}
                  token={token}
                  onMark={(cardId) => handleMark(cardId, board.boardIndex)}
                />
              </div>
            ))}

            {/* Prizes */}
            <div className="bg-th-surface rounded-xl border border-th p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest">Premios</p>
                {room && <span className="text-xs font-bold text-th-accent">{room.pot} mon.</span>}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {prizeButtons(false)}
              </div>
            </div>

            {/* Players */}
            <div className="bg-th-surface rounded-xl border border-th p-3">
              <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest mb-2">
                Jugadores · {room?.players.length ?? 0}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {room?.players.map(p => {
                  const isMe = p.id === playerId
                  const hasClaim = Object.values(claimedPrizes).some(c => c?.playerId === p.id)
                  return (
                    <span
                      key={p.id}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        isMe ? 'bg-th-accent/10 border-th-accent/30 text-th-accent' : 'bg-th border-th text-th'
                      }`}
                    >
                      {p.id === room?.hostId && <Crown className="w-2.5 h-2.5 shrink-0" />}
                      {p.name}
                      {hasClaim && <Star className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Chat */}
            <div className="h-72">
              <Chat />
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2 bg-red-900/30 border border-red-700/40 rounded-lg text-red-400 text-xs flex gap-2" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="shrink-0 hover:text-red-200 flex items-center">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Drawn cards strip */}
        <div className="shrink-0 bg-th-surface border-t border-th px-3 py-2">
          <DrawnCards cards={drawnCards} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DESKTOP LAYOUT  (hidden below lg)
      ══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 gap-4 px-4 py-4 min-h-0 overflow-hidden">

        {/* LEFT — room code + current card + actions + prizes */}
        <div className="w-52 shrink-0 flex flex-col gap-3" style={{ animation: 'fadeSlideUp 0.45s ease 0.07s both' }}>

          {/* Room code */}
          <div className="bg-th-surface rounded-xl border border-th p-4 shrink-0 overflow-hidden relative">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-th-accent/8 blur-2xl pointer-events-none" />
            <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest mb-2">Código de sala</p>
            <div className="bg-th rounded-lg border border-th-accent/20 px-3 py-2.5 mb-3 flex items-center justify-center">
              <span className="font-mono font-ui text-2xl font-black text-th tracking-[0.25em] leading-none">{roomId}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(roomId ?? ''); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="flex-1 py-2 text-xs bg-th-accent/12 hover:bg-th-accent/20 text-th-accent font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 border border-th-accent/25"
              >
                {copied ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?room=${roomId}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="flex-1 py-2 text-xs bg-th-ui hover:bg-th-ui-hover text-th font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3 h-3" /> Compartir
              </button>
            </div>
          </div>

          {/* Current card */}
          <div className="bg-th-surface rounded-xl border border-th p-4 shrink-0">
            <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest mb-3">Carta actual</p>
            <CurrentCard key={currentCard?.id ?? 'empty'} card={currentCard} />
          </div>

          {/* Actions & Prizes */}
          <div className="bg-th-surface rounded-xl border border-th p-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest">Premios</p>
              {room && <span className="text-xs font-bold text-th-accent">{room.pot} mon.</span>}
            </div>
            {isHost && (
              <button
                onClick={() => debounced('draw', handleDraw)}
                disabled={deckExhausted || room?.status !== 'playing'}
                className="flex items-center justify-center gap-2 w-full py-2.5 mb-3 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
              >
                <ChevronsRight className="w-4 h-4 opacity-60" style={{ animation: 'chevronMarch 1.2s ease-in-out infinite' }} />
                {deckExhausted ? 'Mazo agotado' : 'Sacar carta'}
              </button>
            )}
            <div className="space-y-1.5">
              {prizeButtons(true)}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="shrink-0 px-3 py-2 bg-red-900/30 border border-red-700/40 rounded-lg text-red-400 text-xs flex gap-2" style={{ animation: 'fadeSlideUp 0.3s ease both' }}>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="shrink-0 hover:text-red-200 flex items-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* CENTER — my boards */}
        <div className="flex-1 bg-th-surface rounded-xl border border-th flex flex-col min-w-0 overflow-hidden" style={{ animation: 'fadeSlideUp 0.45s ease 0.14s both' }}>
          <div className="shrink-0 px-5 py-4 border-b border-th">
            <p className="font-bold text-th text-sm">Mi tablero</p>
            <p className="text-xs text-th-sub mt-0.5">
              {drawnCards.length} carta{drawnCards.length !== 1 ? 's' : ''} sacada{drawnCards.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 flex flex-wrap items-start justify-center gap-5 overflow-y-auto p-5 content-start">
            {myBoards.map((board) => (
              <div key={board.boardIndex} className="shrink-0">
                {myBoards.length > 1 && (
                  <p className="mb-1.5 text-xs font-bold text-th-sub uppercase tracking-widest text-center">
                    Tablero {board.boardIndex + 1}
                  </p>
                )}
                <PlayerBoard
                  board={board}
                  drawnCardIds={drawnCardIds}
                  token={token}
                  onMark={(cardId) => handleMark(cardId, board.boardIndex)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — players + chat */}
        <div className="w-56 shrink-0 flex flex-col gap-3 overflow-hidden" style={{ animation: 'fadeSlideUp 0.45s ease 0.21s both' }}>
          <div className="bg-th-surface rounded-xl border border-th p-4 shrink-0">
            <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest mb-3">
              Jugadores · {room?.players.length ?? 0}
            </p>
            <ul className="space-y-1">
              {room?.players.map(p => {
                const isMe = p.id === playerId
                const hasClaim = Object.values(claimedPrizes).some(c => c?.playerId === p.id)
                return (
                  <li key={p.id} className="flex items-center justify-between py-1.5 border-b border-th last:border-0 gap-2">
                    <span className={`font-medium text-sm truncate flex items-center gap-1 ${isMe ? 'text-th-accent' : 'text-th'}`}>
                      {p.id === room?.hostId && <Crown className="w-3 h-3 shrink-0" />}
                      {p.name}
                      {isMe && <span className="text-th-sub text-xs ml-0.5">(tú)</span>}
                    </span>
                    {hasClaim && (
                      <span className="shrink-0 text-[10px] bg-green-900/30 text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-700/30 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" /> ganó
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="flex-1 min-h-0">
            <Chat />
          </div>
        </div>
      </div>

      {/* ── Desktop drawn cards history ─────────────────────── */}
      <div className="hidden lg:block shrink-0 bg-th-surface border-t border-th px-4 py-4" style={{ animation: 'fadeSlideUp 0.45s ease 0.28s both' }}>
        <DrawnCards cards={drawnCards} />
      </div>
    </div>
  )
}
