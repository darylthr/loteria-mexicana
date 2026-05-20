import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
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
    socket.emit('chat:message', { roomId, message: msg })
    setInput('')
  }

  const isSystem = (pid: string) => pid === ''

  return (
    <div className="flex flex-col h-full bg-th-surface rounded-xl border border-th overflow-hidden">
      <div className="px-4 py-3 border-b border-th font-bold text-th text-sm">
        Chat
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {messages.length === 0 && (
          <p className="text-th-sub text-xs text-center mt-4">Sin mensajes aún</p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.playerId === playerId
          const sys = isSystem(msg.playerId)
          return (
            <div key={i}>
              {sys ? (
                <div className="text-center">
                  <span className="inline-block px-2.5 py-1 bg-th text-th-accent text-xs rounded-full border border-th">
                    {msg.message}
                  </span>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className={`text-xs font-bold ${isMe ? 'text-th-accent' : 'text-th-sub'}`}>
                      {msg.playerName}
                    </span>
                    <span className="text-th-sub text-[10px] opacity-60">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-th leading-snug">{msg.message}</p>
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2 border-t border-th flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          placeholder="Mensaje…"
          maxLength={200}
          className="flex-1 min-w-0 text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-3 py-2 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 text-white rounded-lg transition-colors flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
