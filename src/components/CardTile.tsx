import type { LoteriaCard } from '../types/game'

interface CardTileProps {
  card: LoteriaCard
  isMarked: boolean
  isDrawn: boolean
  onClick: () => void
}

export default function CardTile({ card, isMarked, isDrawn, onClick }: CardTileProps) {
  const clickable = isDrawn && !isMarked

  return (
    <div
      onClick={clickable ? onClick : undefined}
      title={card.name}
      className={`relative rounded overflow-hidden select-none ${
        clickable ? 'cursor-pointer' : isMarked ? 'opacity-60' : 'opacity-40'
      }`}
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        className="w-full block"
        draggable={false}
      />
      {isMarked && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-900/60">
          <span className="text-green-400 text-3xl drop-shadow">⬤</span>
        </div>
      )}
    </div>
  )
}
