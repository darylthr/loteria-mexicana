import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronsRight, Crown, Check, Copy, Share2, Coins } from 'lucide-react'
import { useGameStore } from '../store/gameStore'
import Chat from '../components/Chat'
import BoardPicker from '../components/BoardPicker'
import BoardCreator from '../components/BoardCreator'
import GameLoader from '../components/GameLoader'
import { getBoards } from '../api/boards'
import type { CustomBoard } from '../api/boards'

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
  const updateAvailableBoard = useGameStore((s) => s.updateAvailableBoard)
  const updateBoardSelection = useGameStore((s) => s.updateBoardSelection)

  const [feeInput, setFeeInput] = useState(0)
  const [feeSaved, setFeeSaved] = useState(true)
  const [selectedBoardIds, setSelectedBoardIds] = useState<string[]>([])
  const [myCustomBoards, setMyCustomBoards] = useState<CustomBoard[]>([])
  const [showCreator, setShowCreator] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getBoards().then(({ boards }) => setMyCustomBoards(boards)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!playerId || !roomId) return

    const socket = initSocket()
    socket.emit('room:join', { roomId })

    socket.on('room:joined', ({ room, player }) => {
      setRoom(room)
      setMyBoards(player.boards)
      setBalance(player.balance)
      setFeeInput(room.entryFee)
      const raw = room.boardSelections[player.id]
      const sels = Array.isArray(raw) ? raw : []
      setSelectedBoardIds(sels.map(s => s.boardId))
      if (room.status === 'playing') navigate(`/game/${roomId}`)
    })

    socket.on('room:player_joined', ({ player }) => { addPlayer(player) })

    socket.on('room:updated', ({ room }) => { setRoom(room); setFeeInput(room.entryFee) })

    socket.on('board:locked', ({ boardId, playerId: lockerId, isCustom }) => {
      updateAvailableBoard(boardId, { lockedByPlayerId: lockerId })
      updateBoardSelection(lockerId, boardId, isCustom, 'add')
      if (lockerId === playerId) setSelectedBoardIds(prev => prev.includes(boardId) ? prev : [...prev, boardId])
    })

    socket.on('board:unlocked', ({ boardId, playerId: unlockerId }) => {
      updateAvailableBoard(boardId, { lockedByPlayerId: null })
      updateBoardSelection(unlockerId, boardId, false, 'remove')
      if (unlockerId === playerId) setSelectedBoardIds(prev => prev.filter(id => id !== boardId))
    })

    socket.on('game:started', ({ room }) => {
      const store = useGameStore.getState()
      setRoom(room)
      const me = room.players.find((p: { id: string }) => p.id === store.playerId)
      if (me) { setMyBoards(me.boards); setBalance(me.balance) }
      navigate(`/game/${roomId}`)
    })

    socket.on('error', ({ message }) => setError(message))

    return () => {
      socket.off('room:joined')
      socket.off('room:player_joined')
      socket.off('room:updated')
      socket.off('board:locked')
      socket.off('board:unlocked')
      socket.off('game:started')
      socket.off('error')
    }
  }, [playerId, roomId])

  const handleSelectBoard = (boardId: string, isCustom: boolean) => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    socket.emit('board:select', { roomId, boardId, isCustom })
  }

  const handleSaveFee = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    socket.emit('room:configure', { roomId, entryFee: feeInput })
    setFeeSaved(true)
  }

  const handleStart = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId) return
    if (isHost && !feeSaved) socket.emit('room:configure', { roomId, entryFee: feeInput })
    socket.emit('game:start', { roomId })
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomId ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mySelectionsRaw = room?.boardSelections[playerId!]
  const mySelections = Array.isArray(mySelectionsRaw) ? mySelectionsRaw : []
  const customCount = mySelections.filter(s => s.isCustom).length
  const boardCount = Math.max(selectedBoardIds.length, 1)
  const estimatedCost = (room?.entryFee ?? 0) * boardCount + 10 * customCount
  const canAfford = balance >= estimatedCost

  const playersWithoutBoard = room?.players.filter(p => {
    const raw = room.boardSelections[p.id]
    return !(Array.isArray(raw) && raw.length > 0)
  }) ?? []

  const canStart = !!room && room.players.length >= 2 && playersWithoutBoard.length === 0

  if (!room) {
    return (
      <div className="h-screen bg-th flex items-center justify-center">
        <GameLoader message="Conectando a la sala…" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-th overflow-hidden">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="shrink-0 bg-th-surface border-b border-th px-5 py-3 flex items-center justify-between">
        <h1 className="text-xl font-black text-th-accent font-display">LOTERÍA</h1>

        <div className="flex items-center gap-5">
          {balance !== undefined && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-th-accent/10 border border-th-accent/25 rounded-full">
              <Coins className="w-3.5 h-3.5 text-th-accent" />
              <span className="font-black text-th-accent text-sm font-ui">{balance}</span>
            </div>
          )}
          <button
            onClick={() => navigate('/')}
            className="text-sm text-th-sub hover:text-th transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* ── Main 3-column area ─────────────────────────────── */}
      <div className="flex-1 flex gap-4 px-4 py-4 min-h-0 overflow-hidden">

        {/* LEFT — room code + config + players + start */}
        <div className="w-60 shrink-0 flex flex-col gap-3">

          {/* Room code */}
          <div className="bg-th-surface rounded-xl border border-th p-4 shrink-0 overflow-hidden relative">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-th-accent/8 blur-2xl pointer-events-none" />
            <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest mb-2">Código de sala</p>
            <div className="bg-th rounded-lg border border-th-accent/20 px-3 py-2.5 mb-3 flex items-center justify-center">
              <span className="font-mono font-ui text-2xl font-black text-th tracking-[0.25em] leading-none">
                {roomId}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="flex-1 py-2 text-xs bg-th-accent/12 hover:bg-th-accent/20 text-th-accent font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 border border-th-accent/25"
              >
                {copied
                  ? <><Check className="w-3 h-3" /> Copiado</>
                  : <><Copy className="w-3 h-3" /> Copiar</>}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join/${roomId}`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="flex-1 py-2 text-xs bg-th-ui hover:bg-th-ui-hover text-th font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3 h-3" /> Compartir
              </button>
            </div>
          </div>

          {/* Config */}
          <div className="bg-th-surface rounded-xl border border-th p-4 shrink-0">
            <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest mb-3">Costo de entrada</p>
            {isHost ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={500} value={feeInput}
                    onChange={e => { setFeeInput(Number(e.target.value)); setFeeSaved(false) }}
                    className="w-20 text-sm"
                  />
                  <span className="text-xs text-th-sub">mon./tablero</span>
                </div>
                {!feeSaved && (
                  <button
                    onClick={handleSaveFee}
                    className="w-full py-1.5 bg-th-ui hover:bg-th-ui-hover text-th text-xs font-semibold rounded-lg transition-colors"
                  >
                    Guardar
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-th">
                <span className="font-black text-th-accent">{room?.entryFee ?? 0}</span>
                <span className="text-th-sub"> monedas/tablero</span>
              </p>
            )}
            <p className={`mt-2 text-xs ${canAfford ? 'text-th-sub' : 'text-red-400 font-semibold'}`}>
              Estimado: <strong>{estimatedCost}</strong> monedas
              {!canAfford && ' · insuficiente'}
            </p>
          </div>

          {/* Players */}
          <div className="bg-th-surface rounded-xl border border-th p-4 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest mb-3">
              Jugadores · {room?.players.length ?? 0}/{room?.maxPlayers ?? 6}
            </p>
            <ul className="space-y-1">
              {room?.players.map(p => {
                const raw = room.boardSelections[p.id]
                const sels = Array.isArray(raw) ? raw : []
                const count = sels.length
                const hasCustom = sels.some(s => s.isCustom)
                const isMe = p.id === playerId
                return (
                  <li key={p.id} className="flex items-center justify-between py-2 border-b border-th last:border-0 gap-2">
                    <span className="font-medium text-th text-sm truncate flex items-center gap-1">
                      {p.id === room.hostId && <Crown className="w-3 h-3 text-th-accent shrink-0" />}
                      {p.name}
                      {isMe && <span className="text-th-sub text-xs ml-0.5">(tú)</span>}
                    </span>
                    {count > 0 ? (
                      <span className="shrink-0 text-[10px] bg-green-900/30 text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-700/30 flex items-center gap-1">
                        {count}{hasCustom ? '+' : ''} <Check className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] bg-th text-th-sub px-2 py-0.5 rounded-full border border-th">
                        pendiente
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="shrink-0 px-3 py-2 bg-red-900/30 border border-red-700/40 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Start / waiting */}
          <div className="shrink-0">
            {isHost ? (
              <div className="space-y-2">
                <button
                  onClick={handleStart}
                  disabled={!canStart}
                  title={playersWithoutBoard.length > 0 ? `Sin tablero: ${playersWithoutBoard.map(p => p.name).join(', ')}` : undefined}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-xl transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
                >
                  <ChevronsRight className="w-5 h-5 opacity-60" />
                  Iniciar juego
                </button>
                {playersWithoutBoard.length > 0 && (
                  <p className="text-xs text-th-sub text-center">
                    Esperando tablero de {playersWithoutBoard.map(p => p.name).join(', ')}
                  </p>
                )}
                {room && room.players.length < 2 && (
                  <p className="text-xs text-th-sub text-center">
                    Necesitas al menos 2 jugadores
                  </p>
                )}
              </div>
            ) : (
              <div className="py-3.5 rounded-xl border border-th bg-th-surface text-center">
                <p className="text-sm text-th-sub">Esperando al anfitrión…</p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER — board picker */}
        <div className="flex-1 bg-th-surface rounded-xl border border-th flex flex-col min-w-0 overflow-hidden">
          <div className="shrink-0 px-5 py-4 border-b border-th flex items-center justify-between">
            <div>
              <p className="font-bold text-th text-sm">Elige tu tablero</p>
              <p className="text-xs text-th-sub mt-0.5">Hasta 2 tableros · los personalizados dan +10 monedas</p>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className="px-3 py-1.5 text-xs bg-th-ui hover:bg-th-ui-hover text-th font-semibold rounded-md transition-colors shrink-0 flex items-center gap-1.5"
            >
              <ChevronsRight className="w-3 h-3" /> Crear tablero
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {room && playerId && (
              <BoardPicker
                availableBoards={room.availableBoards ?? []}
                myCustomBoards={myCustomBoards}
                selectedBoardIds={selectedBoardIds}
                playerId={playerId}
                players={room.players}
                onSelect={handleSelectBoard}
              />
            )}
          </div>
        </div>

        {/* RIGHT — chat */}
        <div className="w-56 shrink-0">
          <Chat />
        </div>
      </div>

      {showCreator && (
        <BoardCreator
          onSaved={async () => {
            const { boards } = await getBoards()
            setMyCustomBoards(boards)
            setShowCreator(false)
          }}
          onCancel={() => setShowCreator(false)}
        />
      )}
    </div>
  )
}
