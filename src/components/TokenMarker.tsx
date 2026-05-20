import React from 'react'

export type TokenType = 'bean' | 'coin' | 'cap'

const TOKENS: Record<TokenType, { label: string; src: string }> = {
  bean: { label: 'Frijol',  src: '/assets/frijol.png'   },
  coin: { label: 'Moneda',  src: '/assets/peso_mxn.png' },
  cap:  { label: 'Tapita',  src: '/assets/tapa.png'     },
}

interface TokenMarkerProps {
  token: TokenType
}

export function TokenMarker({ token }: TokenMarkerProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-3/4 h-3/4">
        <img
          src={TOKENS[token].src}
          alt={TOKENS[token].label}
          className="w-full h-full object-contain drop-shadow-lg"
        />
      </div>
    </div>
  )
}

interface TokenSelectorProps {
  value: TokenType
  onChange: (t: TokenType) => void
}

export function TokenSelector({ value, onChange }: TokenSelectorProps) {
  return (
    <div>
      <div className="flex gap-1.5 justify-center">
        {(Object.keys(TOKENS) as TokenType[]).map(t => (
          <button
            key={t}
            onClick={() => onChange(t)}
            title={TOKENS[t].label}
            className={`w-16 h-16 rounded-xl p-1.5 transition-all ${
              value === t ? 'ring-2 ring-th-accent bg-th-accent/10' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <img
              src={TOKENS[t].src}
              alt={TOKENS[t].label}
              className="w-full h-full object-contain"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
