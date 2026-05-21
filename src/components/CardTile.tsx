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

export default function CardTile({ card, isMarked, isDrawn: _isDrawn, token, onClick }: CardTileProps) {
  return (
    <div
      onClick={onClick}
      title={card.name}
      className="relative overflow-hidden select-none cursor-pointer"
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        className={`w-full block transition-all duration-300 ${isMarked ? 'brightness-[0.35]' : ''}`}
        draggable={false}
      />

      {isMarked && <TokenMarker token={token} />}
    </div>
  )
}
