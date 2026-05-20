import type { LoteriaCard } from '../types/game'
import { TokenMarker } from './TokenMarker'
import type { TokenType } from './TokenMarker'

interface CardTileProps {
  card: LoteriaCard
  isMarked: boolean
  isDrawn: boolean
  token: TokenType
  onClick: () => void
}

export default function CardTile({ card, isMarked, isDrawn, token, onClick }: CardTileProps) {
  const drawable = isDrawn && !isMarked

  return (
    <div
      onClick={drawable ? onClick : undefined}
      title={card.name}
      className={`relative overflow-hidden select-none transition-all duration-200 ${
        drawable ? 'cursor-pointer z-10 scale-[1.04]' : ''
      }`}
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        className={`w-full block transition-all duration-200 ${
          !isDrawn && !isMarked ? 'grayscale brightness-50' : ''
        }${isMarked ? ' brightness-75' : ''}`}
        draggable={false}
      />

      {/* Glowing ring when drawable */}
      {drawable && (
        <div className="absolute inset-0 ring-[3px] ring-inset ring-yellow-300 pointer-events-none shadow-[inset_0_0_12px_rgba(253,224,71,0.4)]" />
      )}

      {isMarked && <TokenMarker token={token} />}
    </div>
  )
}
