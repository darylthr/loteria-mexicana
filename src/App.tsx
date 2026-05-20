import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useGameStore } from './store/gameStore'
import { initTheme } from './lib/theme'
import Auth from './pages/Auth'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import Game from './pages/Game'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'authed' | 'unauthed'>('loading')
  const initAuth = useGameStore((s) => s.initAuth)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        initAuth(session.user.id, session.access_token)
        setStatus('authed')
      } else {
        setStatus('unauthed')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session) {
        initAuth(session.user.id, session.access_token)
        setStatus('authed')
      } else {
        setStatus('unauthed')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (status === 'loading') return null
  if (status === 'unauthed') return <Navigate to="/auth" replace />
  return <>{children}</>
}

export default function App() {
  useEffect(() => { initTheme() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/lobby/:roomId" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
        <Route path="/game/:roomId" element={<ProtectedRoute><Game /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
