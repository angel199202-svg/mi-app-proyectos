'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
}

export default function OnboardingPage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return }
      setChecking(false)
    })
  }, [router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const baseSlug = slugify(orgName)
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    const orgId = crypto.randomUUID()

    // Create org (generate UUID client-side to avoid RLS read-back issue)
    const { error: orgErr } = await supabase
      .from('organizations')
      .insert({ id: orgId, name: orgName.trim(), slug })

    if (orgErr) {
      setError('Error al crear la organización. Intenta de nuevo.')
      setLoading(false)
      return
    }

    // Create owner membership
    const { error: memberErr } = await supabase
      .from('organization_members')
      .insert({ org_id: orgId, user_id: user.id, role: 'owner' })

    if (memberErr) {
      await supabase.from('organizations').delete().eq('id', orgId)
      setError('Error al configurar tu cuenta. Intenta de nuevo.')
      setLoading(false)
      return
    }

    // Create trial subscription (no INSERT policy needed — add one below if missing)
    await supabase
      .from('subscriptions')
      .insert({ org_id: orgId, status: 'trial' })

    router.replace('/app')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Configura tu empresa</h1>
          <p className="text-slate-400 text-sm mt-2">Este es el nombre que verá tu equipo en PYMS.</p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Nombre de tu empresa
              </label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                required
                minLength={2}
                maxLength={60}
                autoFocus
                placeholder="Ej. Distribuidora Central"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
              />
            </div>

            {error && (
              <p className="text-rose-400 text-xs text-center bg-rose-400/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || orgName.trim().length < 2}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-3 rounded-xl transition-all active:scale-[.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Creando...
                </>
              ) : 'Comenzar prueba gratis'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          30 días de prueba gratis · Sin tarjeta de crédito
        </p>
      </div>
    </div>
  )
}
