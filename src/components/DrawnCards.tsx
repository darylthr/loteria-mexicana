import { useEffect, useRef } from 'react'
import type { LoteriaCard } from '../types/game'

export default function DrawnCards({ cards }: { cards: LoteriaCard[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [cards.length])

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-th-sub uppercase tracking-wide shrink-0">
        {cards.length} cartas
      </span>
      <div ref={containerRef} className="flex gap-1.5 overflow-x-auto pb-1">
        {cards.map((card) => (
          <img
            key={card.id}
            src={card.imageUrl}
            alt={card.name}
            title={card.name}
            className="h-16 w-11 object-cover rounded shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            style={{ animation: 'slideInRight 0.35s cubic-bezier(0.34,1.56,0.64,1) both' }}
          />
        ))}
      </div>
    </div>
  )
}
