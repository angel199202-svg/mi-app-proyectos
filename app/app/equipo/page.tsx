'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const MAX_MEMBERS = 5

type Member = {
  id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
  users: { email: string } | null
}

type Invitation = {
  id: string
  email: string
  token: string
  expires_at: string
  created_at: string
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isExpired(iso: string) {
  return new Date(iso) < new Date()
}

export default function EquipoPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [orgId, setOrgId] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  // Actions
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) return
    setOrgId(membership.org_id)
    setIsOwner(membership.role === 'owner')

    // Fetch members with their emails via auth.users — using a view/rpc isn't available
    // so we fetch member records then resolve emails via a service call
    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from('organization_members')
        .select('id, user_id, role, created_at')
        .eq('org_id', membership.org_id)
        .order('created_at'),
      supabase
        .from('invitations')
        .select('id, email, token, expires_at, created_at')
        .eq('org_id', membership.org_id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false }),
    ])

    // Resolve emails: we can only see our own email and rely on display
    // For members, map user_id → email using the current user's known email
    const rawMembers: Omit<Member, 'users'>[] = membersRes.data ?? []
    const withEmails: Member[] = rawMembers.map(m => ({
      ...m,
      users: m.user_id === user.id ? { email: user.email ?? '' } : null,
    }))
    setMembers(withEmails)
    setInvitations(invitesRes.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const totalSlots = members.length + invitations.filter(i => !isExpired(i.expires_at)).length
  const canInvite = isOwner && totalSlots < MAX_MEMBERS

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')

    const email = inviteEmail.trim().toLowerCase()
    if (!email) return

    if (members.some(m => m.users?.email === email)) {
      setInviteError('Ese usuario ya es miembro del equipo')
      return
    }
    if (invitations.some(i => i.email === email && !isExpired(i.expires_at))) {
      setInviteError('Ya existe una invitación pendiente para ese email')
      return
    }

    setInviting(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        org_id: orgId,
        email,
        invited_by: user?.id,
      })
      .select('token')
      .single()

    if (error) {
      setInviteError(error.code === '23505' ? 'Invitación ya existe para ese email' : error.message)
      setInviting(false)
      return
    }

    setInviteEmail('')
    setInviteSuccess(`Invitación creada para ${email}`)
    await load()
    setInviting(false)
  }

  async function removeMember(memberId: string) {
    setRemovingId(memberId)
    await supabase.from('organization_members').delete().eq('id', memberId)
    setMembers(m => m.filter(x => x.id !== memberId))
    setConfirmRemove(null)
    setRemovingId(null)
  }

  async function revokeInvitation(invId: string) {
    setRevokingId(invId)
    await supabase.from('invitations').delete().eq('id', invId)
    setInvitations(i => i.filter(x => x.id !== invId))
    setRevokingId(null)
  }

  function inviteLink(token: string) {
    return `${window.location.origin}/login?invite=${token}`
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(inviteLink(token))
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-7 h-7 text-indigo-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Equipo</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {members.length} miembro{members.length !== 1 ? 's' : ''} · {MAX_MEMBERS - totalSlots} cupo{MAX_MEMBERS - totalSlots !== 1 ? 's' : ''} disponible{MAX_MEMBERS - totalSlots !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Members list */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mb-5">
        <div className="px-5 py-3 border-b border-white/5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Miembros activos</p>
        </div>
        <div className="divide-y divide-white/5">
          {members.map(m => {
            const isMe = m.user_id === currentUserId
            const email = m.users?.email ?? `Usuario (${m.user_id.slice(0, 8)}…)`
            return (
              <div key={m.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                  {email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {email}
                    {isMe && <span className="ml-2 text-xs text-slate-600 font-normal">(tú)</span>}
                  </p>
                  <p className="text-xs text-slate-600">Desde {formatDate(m.created_at)}</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  m.role === 'owner'
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'bg-white/5 text-slate-500'
                }`}>
                  {m.role === 'owner' ? 'Owner' : 'Miembro'}
                </span>

                {isOwner && !isMe && m.role !== 'owner' && (
                  confirmRemove === m.id ? (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => removeMember(m.id)}
                        disabled={removingId === m.id}
                        className="h-7 px-2.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center"
                      >
                        {removingId === m.id ? <Spinner className="w-3 h-3" /> : 'Sí'}
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="h-7 px-2.5 rounded-lg text-xs font-bold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmRemove(m.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Remover del equipo"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                      </svg>
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-3 border-b border-white/5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invitaciones pendientes</p>
          </div>
          <div className="divide-y divide-white/5">
            {invitations.map(inv => {
              const expired = isExpired(inv.expires_at)
              return (
                <div key={inv.id} className={`px-5 py-3.5 flex items-center gap-3 ${expired ? 'opacity-50' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{inv.email}</p>
                    <p className="text-xs text-slate-600">
                      {expired ? 'Expirada' : `Expira ${formatDate(inv.expires_at)}`}
                    </p>
                  </div>

                  {!expired && (
                    <button
                      onClick={() => copyLink(inv.token)}
                      title="Copiar link de invitación"
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                        copiedToken === inv.token
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {copiedToken === inv.token ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          Copiado
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copiar link
                        </>
                      )}
                    </button>
                  )}

                  {isOwner && (
                    <button
                      onClick={() => revokeInvitation(inv.id)}
                      disabled={revokingId === inv.id}
                      title="Revocar invitación"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-50"
                    >
                      {revokingId === inv.id
                        ? <Spinner className="w-3.5 h-3.5" />
                        : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      }
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Invite form */}
      {isOwner && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <div className="mb-4">
            <p className="text-sm font-bold text-white mb-0.5">Invitar al equipo</p>
            <p className="text-xs text-slate-500">
              {canInvite
                ? `Puedes invitar hasta ${MAX_MEMBERS - totalSlots} persona${MAX_MEMBERS - totalSlots !== 1 ? 's' : ''} más.`
                : `Alcanzaste el máximo de ${MAX_MEMBERS} usuarios. Elimina un miembro o invitación para agregar otro.`
              }
            </p>
          </div>

          {canInvite && (
            <form onSubmit={handleInvite} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => { setInviteEmail(e.target.value); setInviteError(''); setInviteSuccess('') }}
                  placeholder="email@empresa.com"
                  required
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                  {inviting ? <Spinner /> : 'Invitar'}
                </button>
              </div>

              {inviteError && (
                <p className="text-rose-400 text-xs bg-rose-400/10 px-3 py-2 rounded-lg">{inviteError}</p>
              )}
              {inviteSuccess && (
                <p className="text-emerald-400 text-xs bg-emerald-400/10 px-3 py-2 rounded-lg">
                  {inviteSuccess} · Copia el link de invitación y envíalo al usuario.
                </p>
              )}
            </form>
          )}

          {/* Slots visual */}
          <div className="flex gap-1.5 mt-4">
            {Array.from({ length: MAX_MEMBERS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < members.length
                    ? 'bg-indigo-500'
                    : i < totalSlots
                    ? 'bg-indigo-500/30'
                    : 'bg-white/5'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-1.5">
            {members.length} activo{members.length !== 1 ? 's' : ''} · {invitations.filter(i => !isExpired(i.expires_at)).length} invitado{invitations.filter(i => !isExpired(i.expires_at)).length !== 1 ? 's' : ''} · {MAX_MEMBERS} máximo
          </p>
        </div>
      )}
    </div>
  )
}
