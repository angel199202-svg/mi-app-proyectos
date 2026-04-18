'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const WHITELIST = ['angel.1992.02@gmail.com', 'milagrospandares@gmail.com']

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const email = session.user.email ?? ''
        if (!WHITELIST.includes(email)) {
          await supabase.auth.signOut()
          router.replace('/?error=no_access')
        } else {
          router.replace('/dashboard')
        }
      }
    })

    // Fallback: si ya hay sesión activa al montar
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const email = data.session.user.email ?? ''
        if (!WHITELIST.includes(email)) {
          await supabase.auth.signOut()
          router.replace('/?error=no_access')
        } else {
          router.replace('/dashboard')
        }
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
      <svg className="w-8 h-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
      </svg>
    </div>
  )
}
