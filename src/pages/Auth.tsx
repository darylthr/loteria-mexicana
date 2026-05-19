import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { createProfile } from '../api/profile'

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
    <div style={{ maxWidth: 360, margin: '80px auto' }}>
      <h1>Lotería</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setMode('login'); setError(null) }} disabled={mode === 'login'}>
          Iniciar sesión
        </button>
        <button onClick={() => { setMode('register'); setError(null) }} disabled={mode === 'register'}>
          Registrarse
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Correo electrónico"
        style={{ display: 'block', marginBottom: 8, width: '100%' }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Contraseña"
        style={{ display: 'block', marginBottom: 8, width: '100%' }}
      />
      {mode === 'register' && (
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Tu nombre en el juego"
          maxLength={24}
          style={{ display: 'block', marginBottom: 8, width: '100%' }}
        />
      )}

      <button
        onClick={mode === 'login' ? handleLogin : handleRegister}
        disabled={loading || !email || !password}
        style={{ marginTop: 4, width: '100%' }}
      >
        {loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
      </button>
    </div>
  )
}
