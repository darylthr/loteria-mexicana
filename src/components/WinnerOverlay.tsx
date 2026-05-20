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

export default function WinnerOverlay({ room, myPlayerId, reason, isHost, onNewGame, onClose }: WinnerOverlayProps) {
  const myEarnings = PRIZE_SLOT_ORDER.reduce((sum, slot) => {
    const claim = room.claimedPrizes[slot]
    return claim?.playerId === myPlayerId ? sum + claim.amount : sum
  }, 0)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-th-surface border border-th rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="text-5xl mb-3">
          {reason === 'all_prizes_claimed' ? '🎊' : '🃏'}
        </div>
        <h2 className="text-2xl font-black text-th mb-1">
          {reason === 'all_prizes_claimed' ? '¡Juego terminado!' : '¡Mazo agotado!'}
        </h2>
        {reason === 'deck_exhausted' && (
          <p className="text-th-sub text-sm mb-4">
            Los premios restantes se repartieron entre todos los jugadores.
          </p>
        )}

        {myEarnings > 0 && (
          <div className="my-4 px-5 py-3 bg-green-900/30 border border-green-700/50 rounded-2xl">
            <p className="text-green-400 text-xl font-black">+{myEarnings} monedas</p>
            <p className="text-green-400/60 text-sm">¡Felicidades!</p>
          </div>
        )}

        <div className="text-left space-y-2 my-5">
          {PRIZE_SLOT_ORDER.map((slot) => {
            const { label, pct } = PRIZE_INFO[slot]
            const claim = room.claimedPrizes[slot]
            if (!claim) return null
            const isMe = claim.playerId === myPlayerId
            return (
              <div key={slot} className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${isMe ? 'bg-green-900/30 border border-green-700/50' : 'bg-th border border-th'}`}>
                <span className="font-semibold text-th">{label} <span className="text-th-sub font-normal">({pct}%)</span></span>
                <span className={`font-bold ${isMe ? 'text-green-400' : 'text-th-sub'}`}>
                  {isMe ? '¡Tú!' : claim.playerName} +{claim.amount}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 justify-center mt-2">
          {isHost && (
            <button
              onClick={onNewGame}
              className="px-6 py-2.5 bg-th-accent hover:bg-th-accent2 text-white font-bold rounded-xl transition-colors"
            >
              Nueva partida
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-th-ui hover:bg-th-ui-hover text-th font-bold rounded-xl transition-colors"
          >
            Volver al inicio
          </button>
        </div>
        {!isHost && (
          <p className="text-th-sub text-xs mt-3">El anfitrión puede iniciar una nueva partida</p>
        )}
      </div>
    </div>
  )
}
