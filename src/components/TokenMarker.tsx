import React from 'react'

export type TokenType = 'bean' | 'coin' | 'cap'

function Bean() {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow">
      <path
        d="M24 6 C35 6 42 13 41 22 C40 31 33 40 24 42 C15 42 7 35 7 26 C7 16 14 6 24 6Z"
        fill="#5C3317"
      />
      <path
        d="M22 11 C30 10 38 16 37 23 C36 30 29 36 21 35 C14 34 9 28 10 21 C12 14 15 12 22 11Z"
        fill="#7A4525"
      />
      <ellipse cx="17" cy="17" rx="5" ry="3" fill="#9B6040" opacity="0.6" transform="rotate(-25 17 17)" />
      <path d="M15 26 C19 21 29 21 33 26" stroke="#4A2810" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function Coin() {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow">
      <circle cx="24" cy="25" r="20" fill="#8B6914" />
      <circle cx="24" cy="24" r="20" fill="#B8860B" />
      <circle cx="24" cy="24" r="17" fill="#DAA520" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="#B8860B" strokeWidth="1.5" />
      <text x="24" y="30" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#8B6914">$</text>
      <ellipse cx="17" cy="16" rx="4" ry="2.5" fill="white" opacity="0.2" transform="rotate(-30 17 16)" />
    </svg>
  )
}

function Cap() {
  const cx = 24, cy = 24, n = 21
  const points = Array.from({ length: n * 2 }, (_, i) => {
    const angle = (2 * Math.PI * i) / (n * 2) - Math.PI / 2
    const r = i % 2 === 0 ? 21 : 17
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
  }).join(' ')

  return (
    <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow">
      <polygon points={points} fill="#AA1500" />
      <circle cx="24" cy="24" r="14" fill="#CC2200" />
      <circle cx="24" cy="24" r="10" fill="#DD3311" />
      <circle cx="24" cy="24" r="6" fill="white" opacity="0.12" />
      <text x="24" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white" opacity="0.85">★</text>
      <ellipse cx="19" cy="18" rx="3" ry="2" fill="white" opacity="0.2" transform="rotate(-20 19 18)" />
    </svg>
  )
}

const TOKENS: Record<TokenType, { label: string; component: () => React.ReactElement }> = {
  bean: { label: 'Frijol', component: Bean },
  coin: { label: 'Moneda', component: Coin },
  cap:  { label: 'Tapita', component: Cap },
}

interface TokenMarkerProps {
  token: TokenType
}

export function TokenMarker({ token }: TokenMarkerProps) {
  const T = TOKENS[token].component
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-3/4 h-3/4">
        <T />
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
        {(Object.keys(TOKENS) as TokenType[]).map(t => {
          const T = TOKENS[t].component
          return (
            <button
              key={t}
              onClick={() => onChange(t)}
              title={TOKENS[t].label}
              className={`w-10 h-10 rounded-lg p-1 transition-all ${
                value === t
                  ? 'bg-th-ui ring-2 ring-th-accent'
                  : 'hover:bg-th-ui'
              }`}
            >
              <T />
            </button>
          )
        })}
      </div>
    </div>
  )
}
