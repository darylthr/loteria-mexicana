import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'

export default function Lobby() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const playerId = useGameStore((s) => s.playerId)
  const isHost = useGameStore((s) => s.isHost)
  const room = useGameStore((s) => s.room)
  const error = useGameStore((s) => s.error)

  const initSocket = useGameStore((s) => s.initSocket)
  const setRoom = useGameStore((s) => s.setRoom)
  const setMyBoard = useGameStore((s) => s.setMyBoard)
  const addPlayer = useGameStore((s) => s.addPlayer)
  const setError = useGameStore((s) => s.setError)

  useEffect(() => {
    if (!playerId || !roomId) return

    const socket = initSocket()

    socket.emit('room:join', { roomId, playerId })

    socket.on('room:joined', ({ room, player }) => {
      setRoom(room)
      setMyBoard(player.board)
      if (room.status === 'playing') navigate(`/game/${roomId}`)
    })

    socket.on('room:player_joined', ({ player }) => {
      addPlayer(player)
    })

    socket.on('game:started', ({ room }) => {
      const store = useGameStore.getState()
      setRoom(room)
      const me = room.players.find((p: any) => p.id === store.playerId)
      if (me) setMyBoard(me.board)
      navigate(`/game/${roomId}`)
    })

    socket.on('error', ({ message }) => setError(message))

    return () => {
      socket.off('room:joined')
      socket.off('room:player_joined')
      socket.off('game:started')
      socket.off('error')
    }
  }, [playerId, roomId])

  const handleStart = () => {
    const socket = useGameStore.getState().socket
    if (!socket || !roomId || !playerId) return
    socket.emit('game:start', { roomId, playerId })
  }

  return (
    <div>
      <h2>Sala: {roomId}</h2>
      <p>Comparte este código con tus amigos para que se unan.</p>

      <h3>Jugadores ({room?.players.length ?? 0} / {room?.maxPlayers ?? 6})</h3>
      <ul>
        {room?.players.map((p) => (
          <li key={p.id}>
            {p.name}
            {p.id === room.hostId ? ' 👑' : ''}
            {p.id === playerId ? ' (tú)' : ''}
          </li>
        ))}
      </ul>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isHost && (
        <button
          onClick={handleStart}
          disabled={!room || room.players.length < 2}
        >
          Iniciar juego
        </button>
      )}

      {!isHost && <p>Esperando que el anfitrión inicie el juego...</p>}
    </div>
  )
}
