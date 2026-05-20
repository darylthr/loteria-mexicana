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
      className={`relative rounded-lg overflow-hidden select-none transition-all ${
        clickable
          ? 'cursor-pointer ring-2 ring-amber-400 ring-offset-1 ring-offset-stone-900 hover:scale-105 shadow-md shadow-amber-400/20'
          : isMarked
          ? 'opacity-60'
          : 'opacity-50'
      }`}
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        className="w-full block"
        draggable={false}
      />
      <div className="text-center text-[10px] py-0.5 bg-stone-800/80 text-stone-300 truncate px-1">
        {card.name}
      </div>
      {isMarked && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-900/60">
          <span className="text-green-400 text-3xl drop-shadow">⬤</span>
        </div>
      )}
    </div>
  )
}
