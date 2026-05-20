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

    socket.on('room:player_joined', ({ player }) => {
      addPlayer(player)
    })

    socket.on('room:updated', ({ room }) => {
      setRoom(room)
      setFeeInput(room.entryFee)
    })

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
      if (me) {
        setMyBoards(me.boards)
        setBalance(me.balance)
      }
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

  return (
    <div className="min-h-screen bg-th">
      {/* Header */}
      <header className="bg-th-surface border-b border-th">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-th-accent tracking-tight">Lotería</h1>
            <p className="text-sm text-th-sub font-mono">
              Sala: <span className="font-bold text-th tracking-widest">{roomId}</span>
              <span className="text-th-sub ml-2">· comparte este código</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-th-sub uppercase tracking-wide">Monedas</p>
            <p className="text-lg font-bold text-th-accent">{balance}</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Config */}
          <div className="bg-th-surface rounded-2xl border border-th p-5">
            <h3 className="font-bold text-th mb-3">Configuración</h3>
            {isHost ? (
              <div className="flex items-center gap-3">
                <label className="text-sm text-th-sub whitespace-nowrap">Costo por tablero:</label>
                <input
                  type="number" min={0} max={500} value={feeInput}
                  onChange={e => { setFeeInput(Number(e.target.value)); setFeeSaved(false) }}
                  className="w-24"
                />
                <button
                  onClick={handleSaveFee}
                  disabled={feeSaved}
                  className="px-3 py-2 bg-th-ui hover:bg-th-ui-hover disabled:opacity-50 text-th text-sm font-semibold rounded-lg transition-colors"
                >
                  {feeSaved ? 'Guardado ✓' : 'Guardar'}
                </button>
              </div>
            ) : (
              <p className="text-sm text-th-sub">
                Costo por tablero: <span className="font-bold text-th">{room?.entryFee ?? 0} monedas</span>
              </p>
            )}
            <p className={`mt-2 text-sm ${canAfford ? 'text-th-sub' : 'text-red-400 font-medium'}`}>
              Costo estimado al iniciar: <strong>{estimatedCost} monedas</strong>
              {customCount > 0 && <span className="text-th-sub opacity-70"> (incl. +10 por tablero personalizado)</span>}
              {' '}· tienes {balance}
              {!canAfford && ' — monedas insuficientes'}
            </p>
          </div>

          {/* Players */}
          <div className="bg-th-surface rounded-2xl border border-th p-5">
            <h3 className="font-bold text-th mb-3">
              Jugadores <span className="text-th-sub font-normal">({room?.players.length ?? 0}/{room?.maxPlayers ?? 6})</span>
            </h3>
            <ul className="space-y-2">
              {room?.players.map(p => {
                const raw = room.boardSelections[p.id]
                const sels = Array.isArray(raw) ? raw : []
                const count = sels.length
                const hasCustom = sels.some(s => s.isCustom)
                const isMe = p.id === playerId
                return (
                  <li key={p.id} className="flex items-center justify-between py-2 border-b border-th last:border-0">
                    <span className="font-medium text-th">
                      {p.name}
                      {p.id === room.hostId && <span className="ml-1.5 text-th-accent">👑</span>}
                      {isMe && <span className="ml-1.5 text-xs text-th-sub">(tú)</span>}
                    </span>
                    {count > 0 ? (
                      <span className="text-xs bg-green-900/30 text-green-400 font-semibold px-2.5 py-1 rounded-full border border-green-700/40">
                        {count} tablero{count > 1 ? 's' : ''}{hasCustom ? ' ★' : ''} ✓
                      </span>
                    ) : (
                      <span className="text-xs bg-th text-th-sub font-medium px-2.5 py-1 rounded-full border border-th">
                        sin tablero
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>

            {error && (
              <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mt-4">
              {isHost ? (
                <button
                  onClick={handleStart}
                  disabled={!room || room.players.length < 2 || playersWithoutBoard.length > 0}
                  title={playersWithoutBoard.length > 0 ? `Sin tablero: ${playersWithoutBoard.map(p => p.name).join(', ')}` : undefined}
                  className="px-5 py-2.5 bg-th-accent hover:bg-th-accent2 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                >
                  Iniciar juego
                </button>
              ) : (
                <p className="text-sm text-th-sub italic">Esperando que el anfitrión inicie el juego…</p>
              )}
              {playersWithoutBoard.length > 0 && (
                <p className="mt-2 text-sm text-th-accent">
                  Esperando tablero de: {playersWithoutBoard.map(p => p.name).join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Board selection */}
          {room && playerId && (
            <div className="bg-th-surface rounded-2xl border border-th p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-th">Elige tu tablero</h3>
                <button
                  onClick={() => setShowCreator(true)}
                  className="px-3 py-1.5 text-sm bg-th-ui hover:bg-th-ui-hover text-th font-medium rounded-lg transition-colors"
                >
                  + Crear tablero
                </button>
              </div>
              <BoardPicker
                availableBoards={room.availableBoards ?? []}
                myCustomBoards={myCustomBoards}
                selectedBoardIds={selectedBoardIds}
                playerId={playerId}
                players={room.players}
                onSelect={handleSelectBoard}
              />
            </div>
          )}
        </div>

        {/* Chat sidebar */}
        <div className="w-72 shrink-0 sticky top-6 h-[520px]">
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
