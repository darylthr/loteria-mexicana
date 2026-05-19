import type { GameRoom } from '../types/game'
import { PRIZE_INFO, PRIZE_SLOT_ORDER } from '../utils/winDetection'

interface WinnerOverlayProps {
  room: GameRoom
  myPlayerId: string | null
  reason: 'all_prizes_claimed' | 'deck_exhausted'
  isHost: boolean
  onNewGame: () => void
  onClose: () => void
}

export default function WinnerOverlay({
  room,
  myPlayerId,
  reason,
  isHost,
  onNewGame,
  onClose,
}: WinnerOverlayProps) {
  const myEarnings = PRIZE_SLOT_ORDER.reduce((sum, slot) => {
    const claim = room.claimedPrizes[slot]
    return claim?.playerId === myPlayerId ? sum + claim.amount : sum
  }, 0)

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
        padding: 16,
      }}
    >
      <div style={{ textAlign: 'center', padding: 32, borderRadius: 12, background: '#fff', maxWidth: 480, width: '100%' }}>
        <h2 style={{ margin: '0 0 4px' }}>
          {reason === 'all_prizes_claimed' ? '🎊 ¡Juego terminado!' : '🃏 ¡Mazo agotado!'}
        </h2>
        <p style={{ opacity: 0.7, fontSize: 14, marginTop: 0 }}>
          {reason === 'deck_exhausted' ? 'Los premios restantes se repartieron entre todos los jugadores.' : ''}
        </p>

        {myEarnings > 0 && (
          <p style={{ fontSize: 20, fontWeight: 700, color: '#28a745' }}>
            ¡Ganaste {myEarnings} monedas!
          </p>
        )}

        <div style={{ textAlign: 'left', margin: '16px 0' }}>
          {PRIZE_SLOT_ORDER.map((slot) => {
            const { label, pct } = PRIZE_INFO[slot]
            const claim = room.claimedPrizes[slot]
            if (!claim) return null
            const isMe = claim.playerId === myPlayerId
            return (
              <div key={slot} style={{ marginBottom: 6, fontSize: 14 }}>
                <strong>{label}</strong> ({pct}%){' '}
                <span style={{ color: isMe ? '#28a745' : '#333' }}>
                  → {isMe ? '¡Tú!' : claim.playerName} +{claim.amount} mon.
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
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
          <p style={{ fontSize: 13, opacity: 0.6, marginTop: 10 }}>
            El anfitrión puede iniciar una nueva partida
          </p>
        )}
      </div>
    </div>
  )
}
