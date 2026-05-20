import { useState } from 'react'
import { createBoard } from '../api/boards'

const ALL_CARDS = Array.from({ length: 54 }, (_, i) => ({
  id: i + 1,
  name: `Carta ${i + 1}`,
  imageUrl: `/cards/${String(i + 1).padStart(2, '0')}.jpg`,
}))

interface Props {
  onSaved: () => void
  onCancel: () => void
}

export default function BoardCreator({ onSaved, onCancel }: Props) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggle = (id: number) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 16 ? [...prev, id] : prev
    )
  }

  const handleSave = async () => {
    if (selected.length !== 16) { setError('Selecciona exactamente 16 cartas'); return }
    if (!name.trim()) { setError('Ponle un nombre al tablero'); return }
    setSaving(true)
    setError(null)
    try {
      await createBoard(name.trim(), selected)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-th-surface rounded-2xl shadow-2xl border border-th max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-th shrink-0">
          <h3 className="text-lg font-bold text-stone-100">Crear tablero personalizado</h3>
          <p className="text-sm text-stone-500 mt-0.5">
            Selecciona exactamente 16 cartas ·{' '}
            <span className={selected.length === 16 ? 'text-green-400 font-semibold' : 'text-stone-500'}>
              {selected.length}/16
            </span>
          </p>
        </div>

        <div className="px-6 py-4 shrink-0">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre del tablero"
            maxLength={40}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="grid grid-cols-9 gap-1.5">
            {ALL_CARDS.map(card => {
              const isSelected = selected.includes(card.id)
              const pos = isSelected ? selected.indexOf(card.id) + 1 : null
              const atMax = selected.length === 16 && !isSelected
              return (
                <div
                  key={card.id}
                  onClick={() => toggle(card.id)}
                  className={`relative cursor-pointer rounded-md overflow-hidden aspect-[2/3] transition-all ${
                    isSelected
                      ? 'ring-2 ring-th-accent shadow-md'
                      : atMax
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:ring-2 hover:ring-th-accent'
                  }`}
                >
                  <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover block" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-th-accent/50 flex items-center justify-center">
                      <span className="text-white font-black text-sm drop-shadow">{pos}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-th shrink-0">
          {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || selected.length !== 16 || !name.trim()}
              className="px-5 py-2.5 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar tablero'}
            </button>
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
