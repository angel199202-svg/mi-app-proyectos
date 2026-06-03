'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin')
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
    } else {
      router.replace('/admin')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontFamily: 'var(--font-script)', fontSize: '48px', color: 'var(--olive)', lineHeight: 1 }}>
            A &amp; M
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '8px' }}>
            Panel de administración
          </p>
        </div>

        <div
          style={{
            background: 'var(--warm)',
            border: '1px solid var(--sand)',
            borderRadius: '4px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(106,107,75,0.1)',
          }}
        >
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%', padding: '12px 14px',
                  fontFamily: 'var(--font-body)', fontSize: '15px',
                  background: 'var(--cream)', border: '1.5px solid var(--sand)',
                  borderRadius: '3px', color: 'var(--text)', outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 14px',
                  fontFamily: 'var(--font-body)', fontSize: '15px',
                  background: 'var(--cream)', border: '1.5px solid var(--sand)',
                  borderRadius: '3px', color: 'var(--text)', outline: 'none',
                }}
              />
            </div>

            {error && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#8B2020', textAlign: 'center' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Ingresar al panel'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a href="/" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em' }}>
            ← Volver al sitio
          </a>
        </div>
      </div>
    </div>
  )
}
