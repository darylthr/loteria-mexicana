import type { LoteriaCard } from '../types/game'

interface CurrentCardProps {
  card: LoteriaCard | null
}

export default function CurrentCard({ card }: CurrentCardProps) {
  if (!card) {
    return (
      <div style={{ width: 180, textAlign: 'center' }}>
        <p>Esperando la primera carta...</p>
      </div>
    )
  }

  return (
    <div style={{ width: 180, textAlign: 'center' }}>
      <img
        src={card.imageUrl}
        alt={card.name}
        style={{ width: '100%', borderRadius: 8 }}
      />
      <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{card.name}</p>
    </div>
  )
}
