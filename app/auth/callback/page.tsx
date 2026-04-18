'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'

async function resolveRedirect(userId: string, userEmail: string, inviteToken: string | null): Promise<string> {
  // Accept by explicit token first (most reliable)
  if (inviteToken) {
    const { data: invite } = await supabase
      .from('invitations')
      .select('id, org_id, expires_at, accepted_at')
      .eq('token', inviteToken)
      .is('accepted_at', null)
      .single()

    if (invite && new Date(invite.expires_at) > new Date()) {
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({ org_id: invite.org_id, user_id: userId, role: 'member' })

      if (!memberError) {
        await supabase
          .from('invitations')
          .update({ accepted_at: new Date().toISOString() })
          .eq('id', invite.id)
      }
      return '/app'
    }
  }

  // Fallback: check by email (for invitations sent before token flow)
  const { data: invite } = await supabase
    .from('invitations')
    .select('id, org_id, expires_at')
    .eq('email', userEmail)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (invite) {
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({ org_id: invite.org_id, user_id: userId, role: 'member' })

    if (!memberError) {
      await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)
    }
    return '/app'
  }

  // Already a member
  const { data: membership } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', userId)
    .single()

  if (membership) return '/app'

  // New user — onboarding
  return '/onboarding'
}

function CallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const dest = await resolveRedirect(session.user.id, session.user.email ?? '', inviteToken)
        router.replace(dest)
      }
    })

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const dest = await resolveRedirect(data.session.user.id, data.session.user.email ?? '', inviteToken)
        router.replace(dest)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [router, inviteToken])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
      <svg className="w-8 h-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
      </svg>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  )
}
