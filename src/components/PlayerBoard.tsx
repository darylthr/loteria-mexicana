import CardTile from './CardTile'
import type { PlayerBoard as PlayerBoardType } from '../types/game'
import type { TokenType } from './TokenMarker'

interface PlayerBoardProps {
  board: PlayerBoardType
  drawnCardIds: Set<number>
  token: TokenType
  onMark: (cardId: number) => void
}

export default function PlayerBoard({ board, drawnCardIds, token, onMark }: PlayerBoardProps) {
  const marked = new Set(board.markedCards)

  return (
    <div
      className="w-full max-w-[368px] rounded-2xl p-3 shadow-2xl shadow-black/60"
      style={{
        background: 'linear-gradient(145deg, #7c4a22 0%, #5c3214 50%, #3e1f0a 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,160,0.15), inset 0 -1px 0 rgba(0,0,0,0.4)',
      }}
    >
      {/* inner groove / inset shadow */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)' }}
      >
        <div className="grid grid-cols-4 gap-[2px] bg-black/40">
          {board.cards.map((card) => (
            <CardTile
              key={card.id}
              card={card}
              isMarked={marked.has(card.id)}
              isDrawn={drawnCardIds.has(card.id)}
              token={token}
              onClick={() => onMark(card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
