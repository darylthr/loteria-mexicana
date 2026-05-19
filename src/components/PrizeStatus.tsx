import type { PrizeSlot, PrizeClaim } from '../types/game'
import { PRIZE_INFO, PRIZE_SLOT_ORDER } from '../utils/winDetection'

interface PrizeStatusProps {
  pot: number
  claimedPrizes: Partial<Record<PrizeSlot, PrizeClaim>>
  myPlayerId: string | null
}

export default function PrizeStatus({ pot, claimedPrizes, myPlayerId }: PrizeStatusProps) {
  return (
    <div>
      <h4 style={{ margin: '0 0 8px' }}>Bote: {pot} monedas</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {PRIZE_SLOT_ORDER.map((slot) => {
          const { label, pct } = PRIZE_INFO[slot]
          const claim = claimedPrizes[slot]
          const amount = Math.floor(pot * pct / 100)
          const isMe = claim?.playerId === myPlayerId

          return (
            <div
              key={slot}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                background: claim ? (isMe ? '#d4edda' : '#f8f9fa') : '#fff3cd',
                border: '1px solid',
                borderColor: claim ? (isMe ? '#28a745' : '#dee2e6') : '#ffc107',
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 600 }}>{label}</span>
              <span style={{ opacity: 0.7 }}> ({pct}% · {amount} mon.)</span>
              {claim ? (
                <span style={{ marginLeft: 8, color: isMe ? '#28a745' : '#6c757d' }}>
                  ✓ {isMe ? '¡Tú!' : claim.playerName}
                </span>
              ) : (
                <span style={{ marginLeft: 8, color: '#856404' }}>disponible</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
