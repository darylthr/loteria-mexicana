import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

interface ChatMessage {
  playerId: string
  playerName: string
  message: string
  timestamp: number
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const playerId = useGameStore((s) => s.playerId)
  const roomId = useGameStore((s) => s.roomId)
  const socket = useGameStore((s) => s.socket)

  useEffect(() => {
    if (!socket) return
    const handler = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    }
    socket.on('chat:message', handler)
    return () => { socket.off('chat:message', handler) }
  }, [socket])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const msg = input.trim()
    if (!msg || !socket || !roomId || !playerId) return
    socket.emit('chat:message', { roomId, playerId, message: msg })
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 300, border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #ddd', fontWeight: 600, fontSize: 14 }}>
        Chat
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {messages.length === 0 && (
          <p style={{ margin: 0, opacity: 0.4, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
            Sin mensajes aún
          </p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.playerId === playerId
          return (
            <div key={i} style={{ fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: isMe ? '#0066cc' : '#333' }}>
                {msg.playerName}
              </span>
              <span style={{ opacity: 0.5, fontSize: 11, marginLeft: 6 }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <br />
              <span>{msg.message}</span>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: 8, borderTop: '1px solid #ddd', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          placeholder="Mensaje..."
          maxLength={200}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button onClick={handleSend} disabled={!input.trim()}>
          Enviar
        </button>
      </div>
    </div>
  )
}
