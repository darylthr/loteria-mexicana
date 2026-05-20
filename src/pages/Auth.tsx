import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { createProfile } from '../api/profile'
import HeroLogo from '../components/HeroLogo'
import FloatLetters from '../components/FloatLetters'

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [btnHover, setBtnHover] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setLoading(true); setError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  const handleRegister = async () => {
    if (!displayName.trim()) { setError('El nombre es requerido'); return }
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      if (!data.session) throw new Error('Revisa tu correo para confirmar tu cuenta')
      await createProfile(displayName.trim())
      navigate('/')
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') mode === 'login' ? handleLogin() : handleRegister()
  }

  return (
    <div className="min-h-screen bg-th flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background image */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'url(/images/bg/bg.png)',
          backgroundSize: 'auto 40%',
          backgroundPosition: 'bottom',
          backgroundRepeat: 'no-repeat',
          opacity: 0.1,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, transparent 20%, var(--th-bg) 80%)' }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Hero */}
        <div className="text-center mb-8">
          <div style={{ animation: 'fadeSlideUp 0.6s ease both' }}>
            <HeroLogo />
          </div>

          <div className="mt-12 mb-10" style={{ animation: 'fadeSlideUp 0.6s ease 0.12s both' }}>
            <div className='flex items-end justify-center'>
              <h1 className="text-6xl font-black font-display text-th leading-none">
                <FloatLetters text="LOTER" />
              </h1>
              <h2 className="text-6xl font-black text-red-400 leading-none">
                <FloatLetters text=".io" />
              </h2>
            </div>
            <p className="text-th-sub text-xl mt-2 tracking-wide">La loteria tradicional mexicana.</p>
          </div>
        </div>

        {/* Form card */}
        <div
          className="bg-th-surface rounded-xl border border-th p-6 shadow-2xl shadow-black/40"
          style={{ animation: 'fadeSlideUp 0.6s ease 0.22s both' }}
        >
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
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
            disabled={loading || !email || !password}
            className="mt-5 relative flex items-center justify-center gap-2 w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-xl transition-all duration-200 active:scale-[0.98] overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(0,0,0,0.08)), var(--th-accent)',
              transform: btnHover ? 'scale(1.03) translateY(-2px)' : undefined,
              boxShadow: btnHover
                ? '0 8px 32px -4px color-mix(in srgb, var(--th-accent) 60%, transparent), 0 0 0 1px color-mix(in srgb, var(--th-accent) 40%, transparent)'
                : '0 10px 24px -4px rgba(0,0,0,0.3)',
            }}
          >
            {btnHover && (
              <span
                className="absolute inset-y-0 w-1/2 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
                  animation: 'shimmerSweep 0.65s ease forwards',
                }}
              />
            )}
            <ChevronsRight
              className="w-5 h-5 shrink-0 relative"
              style={{ animation: 'chevronMarch 1.2s ease-in-out infinite' }}
            />
            <span className="relative">
              {loading ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
