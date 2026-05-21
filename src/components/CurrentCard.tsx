import type { LoteriaCard } from '../types/game'

export default function CurrentCard({ card }: { card: LoteriaCard | null }) {
  if (!card) {
    return (
      <div className="w-full aspect-[2/3] rounded-2xl bg-th-surface border-2 border-dashed border-th flex items-center justify-center">
        <p className="text-th-sub text-sm text-center px-4">Esperando la primera carta…</p>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ animation: 'cardFlipIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
      <div className="rounded-2xl overflow-hidden shadow-xl shadow-black/30 ring-2 ring-th-accent">
        <img src={card.imageUrl} alt={card.name} className="w-full block" />
      </div>
      <p className="mt-2 text-center text-sm font-bold text-th">{card.name}</p>
    </div>
  )
}
