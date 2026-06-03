'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LinkIcon, EditIcon, TrashIcon, ChatIcon, CelebrationIcon, HeartEnvelopeIcon, CheckIcon } from '../../components/Icons'

type Guest = {
  id: string
  code: string
  name: string
  email: string | null
  allow_plus_one: boolean
  rsvp_attending: boolean | null
  rsvp_plus_one: boolean | null
  rsvp_plus_one_name: string | null
  rsvp_dietary: string | null
  rsvp_message: string | null
  rsvp_at: string | null
  created_at: string
}

type FormData = {
  code: string
  name: string
  email: string
  allow_plus_one: boolean
}

const EMPTY_FORM: FormData = { code: '', name: '', email: '', allow_plus_one: false }

function rsvpBadge(guest: Guest) {
  if (guest.rsvp_attending === null) return { label: 'Sin respuesta', bg: 'var(--sand)', color: 'var(--muted)' }
  if (guest.rsvp_attending === true)  return { label: guest.rsvp_plus_one ? 'Asiste +1' : 'Asiste', bg: '#d4e8d0', color: '#3a6636' }
  return { label: 'No asiste', bg: '#f0dede', color: '#8B2020' }
}

function generateCode(name: string): string {
  const prefix = name.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'INV'
  const num = String(Math.floor(Math.random() * 900) + 100)
  return `${prefix}-${num}`
}

export default function InvitadosPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRsvp, setFilterRsvp] = useState<'all' | 'pending' | 'yes' | 'no'>('all')

  async function load() {
    const { data } = await supabase
      .from('wedding_guests')
      .select('*')
      .order('created_at', { ascending: false })
    setGuests(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowModal(true)
  }

  function openEdit(g: Guest) {
    setEditing(g)
    setForm({ code: g.code, name: g.name, email: g.email ?? '', allow_plus_one: g.allow_plus_one })
    setError('')
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) return
    setSaving(true)
    setError('')

    const payload = {
      code:           form.code.trim().toUpperCase(),
      name:           form.name.trim(),
      email:          form.email.trim() || null,
      allow_plus_one: form.allow_plus_one,
    }

    let err
    if (editing) {
      ;({ error: err } = await supabase.from('wedding_guests').update(payload).eq('id', editing.id))
    } else {
      ;({ error: err } = await supabase.from('wedding_guests').insert(payload))
    }

    setSaving(false)
    if (err) {
      setError(err.code === '23505' ? 'Ese código ya existe. Usa uno diferente.' : err.message)
      return
    }
    setShowModal(false)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este invitado? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    await supabase.from('wedding_guests').delete().eq('id', id)
    setDeleting(null)
    load()
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/invitacion?code=${encodeURIComponent(code)}`
    navigator.clipboard.writeText(url)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = guests.filter((g) => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.code.toLowerCase().includes(search.toLowerCase())
    const matchRsvp =
      filterRsvp === 'all' ? true :
      filterRsvp === 'pending' ? g.rsvp_attending === null :
      filterRsvp === 'yes' ? g.rsvp_attending === true :
      g.rsvp_attending === false
    return matchSearch && matchRsvp
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    fontFamily: 'var(--font-body)', fontSize: '14px',
    background: 'var(--cream)', border: '1.5px solid var(--sand)',
    borderRadius: '3px', color: 'var(--text)', outline: 'none',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '32px', fontWeight: 300, color: 'var(--olive)' }}>
            Invitados
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            {guests.length} invitados · {guests.filter((g) => g.rsvp_attending === true).length} confirmados
          </p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo invitado</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 'auto', flex: '1 1 200px', minWidth: '180px' }}
        />
        {(['all', 'pending', 'yes', 'no'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterRsvp(f)}
            style={{
              padding: '10px 16px',
              fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              borderRadius: '3px', border: '1.5px solid',
              borderColor: filterRsvp === f ? 'var(--olive)' : 'var(--sand)',
              background: filterRsvp === f ? 'var(--olive)' : 'transparent',
              color: filterRsvp === f ? 'var(--cream)' : 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            {{ all: 'Todos', pending: 'Sin respuesta', yes: 'Asisten', no: 'No asisten' }[f]}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--warm)', border: '1px solid var(--sand)', borderRadius: '4px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '20px', color: 'var(--muted)' }}>
            {guests.length === 0 ? 'Aún no hay invitados. Agrega el primero.' : 'Sin resultados para este filtro.'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'var(--warm)', border: '1px solid var(--sand)', borderRadius: '4px', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto auto',
            padding: '10px 16px', borderBottom: '1px solid var(--sand)',
            background: 'var(--cream)',
          }}>
            {['Nombre', 'Código', '+1', 'RSVP', 'Mensaje', 'Acciones'].map((h) => (
              <span key={h} style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {h}
              </span>
            ))}
          </div>

          {filtered.map((g, i) => {
            const badge = rsvpBadge(g)
            return (
              <div
                key={g.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto auto',
                  padding: '14px 16px', alignItems: 'center', gap: '8px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--sand)' : 'none',
                  background: 'var(--warm)',
                }}
              >
                {/* Name */}
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text)', fontWeight: 400 }}>{g.name}</p>
                  {g.email && <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)' }}>{g.email}</p>}
                  {g.rsvp_plus_one_name && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
                      + {g.rsvp_plus_one_name}
                    </p>
                  )}
                </div>

                {/* Code */}
                <code style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--olive)', background: 'var(--cream)', padding: '3px 8px', borderRadius: '3px', border: '1px solid var(--sand)' }}>
                  {g.code}
                </code>

                {/* Plus one allowed */}
                <span style={{ fontSize: '16px', textAlign: 'center' }}>
                  {g.allow_plus_one ? '✓' : '–'}
                </span>

                {/* RSVP badge */}
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: badge.bg, color: badge.color,
                  padding: '4px 8px', borderRadius: '3px', whiteSpace: 'nowrap',
                }}>
                  {badge.label}
                </span>

                {/* Message */}
                <span title={g.rsvp_message ?? ''} style={{ fontSize: '16px', textAlign: 'center', cursor: g.rsvp_message ? 'help' : 'default' }}>
                  {g.rsvp_message ? <ChatIcon size={14} color='var(--olive)' strokeWidth={1.5} /> : <span style={{ color: 'var(--muted)', fontSize: '14px' }}>–</span>}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => copyLink(g.code)}
                    title="Copiar link de invitación"
                    style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    {copied === g.code ? <CheckIcon size={14} color='var(--olive)' strokeWidth={2.5} /> : <LinkIcon size={14} color='var(--olive)' strokeWidth={1.5} />}
                  </button>
                  <button
                    onClick={() => openEdit(g)}
                    title="Editar"
                    style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    <EditIcon size={14} color='var(--olive)' strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    title="Eliminar"
                    disabled={deleting === g.id}
                    style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer', fontSize: '13px', opacity: deleting === g.id ? 0.4 : 1 }}
                  >
                    <TrashIcon size={14} color='var(--olive)' strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* RSVP details section */}
      {guests.some((g) => g.rsvp_dietary || g.rsvp_message) && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '22px', color: 'var(--olive)', marginBottom: '16px' }}>
            Notas de invitados
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {guests.filter((g) => g.rsvp_dietary || g.rsvp_message).map((g) => (
              <div key={g.id} style={{ background: 'var(--warm)', border: '1px solid var(--sand)', borderRadius: '4px', padding: '16px 20px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 700, color: 'var(--olive)', marginBottom: '6px' }}>{g.name}</p>
                {g.rsvp_dietary && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)' }}>🍽 {g.rsvp_dietary}</p>}
                {g.rsvp_message && <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '15px', color: 'var(--muted)', marginTop: '4px' }}>"{g.rsvp_message}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(58,58,40,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', zIndex: 50,
            animation: 'fade-in 0.15s ease-out both',
          }}
        >
          <div
            style={{
              background: 'var(--warm)', borderRadius: '4px', padding: '32px',
              width: '100%', maxWidth: 440,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'fade-up 0.2s ease-out both',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '24px', color: 'var(--olive)', marginBottom: '24px' }}>
              {editing ? 'Editar invitado' : 'Nuevo invitado'}
            </h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm((f) => ({ ...f, name, code: editing ? f.code : generateCode(name) }))
                  }}
                  required
                  style={inputStyle}
                  placeholder="María González"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    Código de invitación *
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, code: generateCode(f.name) }))}
                    style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--olive)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em' }}
                  >
                    ↺ Regenerar
                  </button>
                </div>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  required
                  style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', fontSize: '15px' }}
                  placeholder="MARI-123"
                />
              </div>

              <div>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  style={inputStyle}
                  placeholder="maria@ejemplo.com"
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 14px', background: 'var(--cream)', border: '1.5px solid var(--sand)', borderRadius: '3px' }}>
                <input
                  type="checkbox"
                  checked={form.allow_plus_one}
                  onChange={(e) => setForm((f) => ({ ...f, allow_plus_one: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--olive)' }}
                />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)' }}>
                  Puede traer acompañante (+1)
                </span>
              </label>

              {error && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#8B2020' }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar invitado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
