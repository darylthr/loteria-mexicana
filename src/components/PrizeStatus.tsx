import type { PrizeSlot, PrizeClaim } from '../types/game'
import { PRIZE_INFO, PRIZE_SLOT_ORDER } from '../utils/winDetection'

interface PrizeStatusProps {
  pot: number
  claimedPrizes: Partial<Record<PrizeSlot, PrizeClaim>>
  myPlayerId: string | null
}

export default function PrizeStatus({ pot, claimedPrizes, myPlayerId }: PrizeStatusProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-th-sub uppercase tracking-wide">Bote</span>
        <span className="font-bold text-th-accent">{pot} mon.</span>
      </div>
      {PRIZE_SLOT_ORDER.map((slot) => {
        const { label, pct } = PRIZE_INFO[slot]
        const claim = claimedPrizes[slot]
        const amount = Math.floor(pot * pct / 100)
        const isMe = claim?.playerId === myPlayerId

        return (
          <div
            key={slot}
            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 ${
              claim
                ? isMe
                  ? 'bg-green-900/30 border border-green-700/50'
                  : 'bg-th border border-th'
                : 'bg-th-accent/10 border border-th-accent/30'
            }`}
          >
            <div>
              <span className="font-semibold text-th">{label}</span>
              <span className="text-th-sub ml-1">·{amount}</span>
            </div>
            {claim ? (
              <span className={`font-semibold ${isMe ? 'text-green-400' : 'text-th-sub'}`}>
                {isMe ? '¡Tú!' : claim.playerName}
              </span>
            ) : (
              <span className="text-th-accent font-medium">libre</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
