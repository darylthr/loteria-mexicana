import type { PrizeSlot, PrizeClaim } from '../types/game'
import { PRIZE_INFO, PRIZE_SLOT_ORDER } from '../utils/winDetection'

interface PrizeStatusProps {
  pot: number
  claimedPrizes: Partial<Record<PrizeSlot, PrizeClaim>>
  myPlayerId: string | null
}

export default function PrizeStatus({ pot, claimedPrizes, myPlayerId }: PrizeStatusProps) {
  return (
    <div className="bg-th-surface rounded-2xl border border-th p-4 space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-stone-400 uppercase tracking-wide">Bote</span>
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
                  ? 'bg-green-900/50 border border-green-700'
                  : 'bg-stone-700/50 border border-stone-600'
                : 'bg-amber-900/30 border border-amber-700/50'
            }`}
          >
            <div>
              <span className="font-semibold text-stone-200">{label}</span>
              <span className="text-stone-500 ml-1">·{amount}</span>
            </div>
            {claim ? (
              <span className={`font-semibold ${isMe ? 'text-green-400' : 'text-stone-400'}`}>
                {isMe ? '¡Tú!' : claim.playerName}
              </span>
            ) : (
              <span className="text-amber-500 font-medium">libre</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
