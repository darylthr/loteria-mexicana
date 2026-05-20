import type { LoteriaCard } from '../types/game'

export default function DrawnCards({ cards }: { cards: LoteriaCard[] }) {
  return (
    <div>
      <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">
        Cartas llamadas — {cards.length}
      </p>
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
        {cards.map((card) => (
          <img
            key={card.id}
            src={card.imageUrl}
            alt={card.name}
            title={card.name}
            className="w-10 h-14 object-cover rounded-md opacity-80 hover:opacity-100 transition-opacity"
          />
        ))}
      </div>
    </div>
  )
}
