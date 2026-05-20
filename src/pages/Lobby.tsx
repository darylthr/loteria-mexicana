import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import Chat from '../components/Chat'
import BoardPicker from '../components/BoardPicker'
import BoardCreator from '../components/BoardCreator'
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

  return (
    <div className="h-screen flex flex-col bg-th overflow-hidden">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="shrink-0 bg-th-surface border-b border-th px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <h1 className="text-xl font-black text-th-accent tracking-tight">LOTERÍA</h1>

          <div className="h-5 w-px bg-th" />

          {/* Room code */}
          <div>
            <p className="text-[10px] text-th-sub uppercase tracking-widest mb-0.5">Código de sala</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-black text-th tracking-widest leading-none">
                {roomId}
              </span>
              <button
                onClick={handleCopyCode}
                className="text-xs px-2 py-0.5 rounded-md bg-th-ui hover:bg-th-ui-hover text-th-sub transition-colors"
              >
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {balance !== undefined && (
            <div className="text-right">
              <p className="text-[10px] text-th-sub uppercase tracking-widest">Monedas</p>
              <p className="text-base font-bold text-th-accent">{balance}</p>
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

        {/* LEFT — players + config + start */}
        <div className="w-60 shrink-0 flex flex-col gap-3">

          {/* Players */}
          <div className="bg-th-surface rounded-2xl border border-th p-4 flex-1 overflow-y-auto">
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
                    <span className="font-medium text-th text-sm truncate">
                      {p.id === room.hostId && <span className="text-th-accent mr-1">👑</span>}
                      {p.name}
                      {isMe && <span className="text-th-sub text-xs ml-1">(tú)</span>}
                    </span>
                    {count > 0 ? (
                      <span className="shrink-0 text-[10px] bg-green-900/30 text-green-400 font-bold px-2 py-0.5 rounded-full border border-green-700/30">
                        {count}{hasCustom ? '★' : ''} ✓
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

          {/* Config */}
          <div className="bg-th-surface rounded-2xl border border-th p-4 shrink-0">
            <p className="text-[10px] font-bold text-th-sub uppercase tracking-widest mb-3">Entrada</p>
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
              Costo estimado: <strong>{estimatedCost}</strong> monedas
              {!canAfford && ' · insuficiente'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="shrink-0 px-3 py-2 bg-red-900/30 border border-red-700/40 rounded-xl text-red-400 text-xs">
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
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
                >
                  <span className="opacity-60 text-sm">»»</span>
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
              <div className="py-3.5 rounded-2xl border border-th bg-th-surface text-center">
                <p className="text-sm text-th-sub">Esperando al anfitrión…</p>
              </div>
            )}
          </div>
        </div>

        {/* CENTER — board picker */}
        <div className="flex-1 bg-th-surface rounded-2xl border border-th flex flex-col min-w-0 overflow-hidden">
          <div className="shrink-0 px-5 py-4 border-b border-th flex items-center justify-between">
            <div>
              <p className="font-bold text-th text-sm">Elige tu tablero</p>
              <p className="text-xs text-th-sub mt-0.5">Hasta 2 tableros · los personalizados dan +10 monedas</p>
            </div>
            <button
              onClick={() => setShowCreator(true)}
              className="px-3 py-1.5 text-xs bg-th-ui hover:bg-th-ui-hover text-th font-semibold rounded-lg transition-colors shrink-0"
            >
              + Crear tablero
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
