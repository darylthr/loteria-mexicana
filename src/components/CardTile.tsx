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
  return (
    <div
      onClick={isDrawn && !isMarked ? onClick : undefined}
      title={card.name}
      className={`relative rounded overflow-hidden select-none ${isDrawn && !isMarked ? 'cursor-pointer' : ''}`}
    >
      <img src={card.imageUrl} alt={card.name} className="w-full block" draggable={false} />
      {isMarked && <TokenMarker token={token} />}
    </div>
  )
}
