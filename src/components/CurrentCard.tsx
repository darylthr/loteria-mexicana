import type { LoteriaCard } from '../types/game'

export default function CurrentCard({ card }: { card: LoteriaCard | null }) {
  if (!card) {
    return (
      <div className="w-full aspect-[2/3] rounded-2xl bg-stone-800 border-2 border-dashed border-stone-600 flex items-center justify-center">
        <p className="text-stone-500 text-sm text-center px-4">Esperando la primera carta…</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="rounded-2xl overflow-hidden shadow-xl shadow-black/40 ring-2 ring-amber-500/40">
        <img src={card.imageUrl} alt={card.name} className="w-full block" />
      </div>
      <p className="mt-2 text-center text-sm font-bold text-stone-200">{card.name}</p>
    </div>
  )
}
