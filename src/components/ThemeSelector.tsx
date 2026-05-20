import { useState } from 'react'
import { THEMES, getTheme, setTheme } from '../lib/theme'
import type { ThemeId } from '../lib/theme'

export default function ThemeSelector() {
  const [current, setCurrent] = useState<ThemeId>(getTheme)

  const handleChange = (id: ThemeId) => {
    setTheme(id)
    setCurrent(id)
  }

  return (
    <div>
      <p className="text-xs text-stone-400 uppercase tracking-wide mb-3">Tema</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.entries(THEMES) as [ThemeId, typeof THEMES[ThemeId]][]).map(([id, t]) => (
          <button
            key={id}
            onClick={() => handleChange(id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${
              current === id
                ? 'border-stone-400 bg-th-surface ring-2 ring-th-accent'
                : 'border-th bg-th-surface hover:border-stone-500'
            }`}
          >
            {/* Colour swatches */}
            <div className="flex shrink-0">
              {t.swatches.map((color, i) => (
                <div
                  key={i}
                  className={`w-3.5 h-7 ${i === 0 ? 'rounded-l-md' : ''} ${i === t.swatches.length - 1 ? 'rounded-r-md' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-stone-100 leading-tight">{t.label}</p>
              <p className="text-[10px] text-stone-500">{t.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
