import { useState } from 'react'
import { createBoard } from '../api/boards'

// All 54 cards — id matches imageUrl /cards/NN.jpg
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 4px' }}>Crear tablero personalizado</h3>
        <p style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.6 }}>
          Selecciona exactamente 16 cartas · {selected.length}/16
        </p>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre del tablero"
          maxLength={40}
          style={{ width: '100%', marginBottom: 12, boxSizing: 'border-box' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 4, marginBottom: 16 }}>
          {ALL_CARDS.map(card => {
            const isSelected = selected.includes(card.id)
            const pos = isSelected ? selected.indexOf(card.id) + 1 : null
            return (
              <div
                key={card.id}
                onClick={() => toggle(card.id)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: isSelected ? '2px solid #0066cc' : '2px solid transparent',
                  opacity: !isSelected && selected.length === 16 ? 0.35 : 1,
                  aspectRatio: '2/3',
                }}
              >
                <img src={card.imageUrl} alt={card.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {isSelected && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,102,204,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{pos}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {error && <p style={{ color: 'red', margin: '0 0 12px', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={saving || selected.length !== 16 || !name.trim()}>
            {saving ? 'Guardando...' : 'Guardar tablero'}
          </button>
          <button onClick={onCancel} style={{ opacity: 0.6 }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
