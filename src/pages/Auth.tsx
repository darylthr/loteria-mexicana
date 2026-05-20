import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { createProfile } from '../api/profile'

const DECORATIVE = [
  { id: '07', cls: 'absolute left-[3%]  top-[8%]    w-20 rotate-[-16deg] opacity-[0.07]' },
  { id: '33', cls: 'absolute right-[4%] top-[6%]    w-24 rotate-[13deg]  opacity-[0.07]' },
  { id: '16', cls: 'absolute left-[18%] top-[20%]   w-14 rotate-[6deg]   opacity-[0.04]' },
  { id: '42', cls: 'absolute right-[17%] top-[22%]  w-14 rotate-[-10deg] opacity-[0.04]' },
  { id: '04', cls: 'absolute left-[2%]  bottom-[10%] w-20 rotate-[15deg]  opacity-[0.07]' },
  { id: '51', cls: 'absolute right-[3%] bottom-[8%]  w-24 rotate-[-13deg] opacity-[0.07]' },
  { id: '22', cls: 'absolute left-[22%] bottom-[5%]  w-16 rotate-[-6deg]  opacity-[0.05]' },
  { id: '10', cls: 'absolute right-[20%] bottom-[7%] w-16 rotate-[8deg]   opacity-[0.05]' },
]

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!displayName.trim()) { setError('El nombre es requerido'); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (!data.session) throw new Error('Revisa tu correo para confirmar tu cuenta')
      await createProfile(displayName.trim())
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') mode === 'login' ? handleLogin() : handleRegister()
  }

  return (
    <div className="min-h-screen bg-th flex items-center justify-center p-4 relative overflow-hidden">

      {/* Scattered decorative cards */}
      {DECORATIVE.map((d) => (
        <img
          key={d.id}
          src={`/cards/${d.id.padStart(2, '0')}.jpg`}
          alt=""
          className={`${d.cls} rounded-lg pointer-events-none select-none`}
        />
      ))}

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, var(--th-bg) 25%, transparent 100%)' }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="mb-5">
            <img
              src="/assets/loteria.png"
              alt="Tablero Lotería"
              className="w-48 h-auto object-contain rounded-lg rotate-[-2deg] shadow-2xl shadow-black/50 mx-auto"
              style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.6))' }}
            />
          </div>
          <h1 className="text-5xl font-black text-th font-display leading-none">LOTERÍA</h1>
          <p className="text-th-sub text-sm mt-2">El juego tradicional mexicano</p>
        </div>

        {/* Form card */}
        <div className="bg-th-surface rounded-xl border border-th p-6 shadow-2xl shadow-black/40">

          {/* Mode tabs */}
          <div className="flex rounded-lg bg-th p-1 mb-5">
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                mode === 'login' ? 'bg-th-ui text-th shadow-sm' : 'text-th-sub hover:text-th'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMode('register'); setError(null) }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                mode === 'register' ? 'bg-th-ui text-th shadow-sm' : 'text-th-sub hover:text-th'
              }`}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 bg-red-900/40 border border-red-700/60 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Correo electrónico"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Contraseña"
            />
            {mode === 'register' && (
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Tu nombre en el juego"
                maxLength={24}
              />
            )}
          </div>

          <button
            onClick={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading || !email || !password}
            className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 bg-th-accent hover:bg-th-accent2 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-xl transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
          >
            <ChevronsRight className="w-5 h-5 opacity-60" />
            {loading ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  )
}
