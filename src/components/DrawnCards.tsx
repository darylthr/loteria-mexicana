import type { LoteriaCard } from '../types/game'

export default function DrawnCards({ cards }: { cards: LoteriaCard[] }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-th-sub uppercase tracking-wide shrink-0">
        {cards.length} cartas
      </span>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {cards.map((card) => (
          <img
            key={card.id}
            src={card.imageUrl}
            alt={card.name}
            title={card.name}
            className="h-16 w-11 object-cover rounded shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          />
        ))}
      </div>
    </div>
  )
}
