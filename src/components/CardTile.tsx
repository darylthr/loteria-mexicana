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
      style={{
        cursor: clickable ? 'pointer' : 'default',
        opacity: isMarked ? 0.45 : 1,
        outline: isMarked ? '3px solid #22c55e' : '1px solid #d1d5db',
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        style={{ width: '100%', display: 'block' }}
        draggable={false}
      />
      <div style={{ textAlign: 'center', fontSize: 11, padding: '2px 0' }}>{card.name}</div>
      {isMarked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 32 }}>⬤</span>
        </div>
      )}
    </div>
  )
}
