import type { WinPattern } from '../types/game'

const PATTERN_LABELS: Record<WinPattern, string> = {
  row: 'Línea',
  column: 'Columna',
  diagonal: 'Diagonal',
  square: 'Cuadro 2×2',
  corners: 'Esquinas',
  full_board: 'Tabla Completa',
}

interface WinnerOverlayProps {
  playerName: string
  pattern: WinPattern
  isMe: boolean
  isHost: boolean
  onClose: () => void
  onNewGame: () => void
}

export default function WinnerOverlay({ playerName, pattern, isMe, isHost, onClose, onNewGame }: WinnerOverlayProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div style={{ textAlign: 'center', padding: 32, borderRadius: 12, background: '#fff' }}>
        <h1 style={{ fontSize: 48, margin: '0 0 8px' }}>🎉 ¡Lotería!</h1>
        {isMe ? (
          <p style={{ fontSize: 24, fontWeight: 700 }}>¡Ganaste!</p>
        ) : (
          <p style={{ fontSize: 20 }}>
            <strong>{playerName}</strong> ganó
          </p>
        )}
        <p style={{ fontSize: 16, opacity: 0.7 }}>Patrón: {PATTERN_LABELS[pattern]}</p>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
          {isHost && (
            <button onClick={onNewGame} style={{ padding: '10px 24px' }}>
              Nueva partida
            </button>
          )}
          <button onClick={onClose} style={{ padding: '10px 24px' }}>
            Volver al inicio
          </button>
        </div>
        {!isHost && (
          <p style={{ fontSize: 14, opacity: 0.6, marginTop: 12 }}>
            El anfitrión puede iniciar una nueva partida
          </p>
        )}
      </div>
    </div>
  )
}
