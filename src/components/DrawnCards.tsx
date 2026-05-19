import type { LoteriaCard } from '../types/game'

interface DrawnCardsProps {
  cards: LoteriaCard[]
}

export default function DrawnCards({ cards }: DrawnCardsProps) {
  return (
    <div>
      <p style={{ margin: '0 0 4px', fontSize: 13, opacity: 0.7 }}>
        Cartas llamadas: {cards.length}
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          maxHeight: 160,
          overflowY: 'auto',
        }}
      >
        {cards.map((card) => (
          <img
            key={card.id}
            src={card.imageUrl}
            alt={card.name}
            title={card.name}
            style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 4 }}
          />
        ))}
      </div>
    </div>
  )
}
