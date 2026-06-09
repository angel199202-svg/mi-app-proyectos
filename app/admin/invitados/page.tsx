'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LinkIcon, EditIcon, TrashIcon, ChatIcon, CheckIcon } from '../../components/Icons'

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

type BulkRow = {
  name: string
  email: string
  allow_plus_one: boolean
  code: string
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

function parseBulkText(text: string): BulkRow[] {
  const usedCodes = new Set<string>()
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawName = '', rawEmail = '', rawPlus = ''] = line.split(',').map((p) => p.trim())
      const name = rawName
      const email = rawEmail
      const allow_plus_one = ['true', '1', 'si', 'sí', 'yes', 'x'].includes(rawPlus.toLowerCase())
      let code = generateCode(name)
      let tries = 0
      while (usedCodes.has(code) && tries < 20) { code = generateCode(name); tries++ }
      usedCodes.add(code)
      return { name, email, allow_plus_one, code }
    })
    .filter((r) => r.name)
}

export default function InvitadosPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

  // single guest modal
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Guest | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // table ui
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRsvp, setFilterRsvp] = useState<'all' | 'pending' | 'yes' | 'no'>('all')

  // bulk import
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])
  const [bulkStep, setBulkStep] = useState<'input' | 'preview' | 'done'>('input')
  const [bulkImporting, setBulkImporting] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ ok: number; failed: number } | null>(null)

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

  // ─── Bulk import handlers ───────────────────────
  function openBulk() {
    setBulkText('')
    setBulkRows([])
    setBulkStep('input')
    setBulkResult(null)
    setShowBulk(true)
  }

  function handleBulkPreview() {
    const rows = parseBulkText(bulkText)
    if (!rows.length) return
    setBulkRows(rows)
    setBulkStep('preview')
  }

  async function handleBulkImport() {
    if (!bulkRows.length) return
    setBulkImporting(true)

    const payload = bulkRows.map((r) => ({
      name:           r.name,
      email:          r.email || null,
      allow_plus_one: r.allow_plus_one,
      code:           r.code,
    }))

    // try batch first
    const { data, error: batchErr } = await supabase
      .from('wedding_guests')
      .insert(payload)
      .select('id')

    let ok = 0
    let failed = 0

    if (batchErr) {
      // batch failed (likely duplicate code) — insert row by row
      for (const row of payload) {
        const { error: rowErr } = await supabase.from('wedding_guests').insert(row)
        if (rowErr) failed++
        else ok++
      }
    } else {
      ok = data?.length ?? payload.length
    }

    setBulkImporting(false)
    setBulkResult({ ok, failed })
    setBulkStep('done')
    load()
  }

  // ─── Filters ────────────────────────────────────
  const filtered = guests.filter((g) => {
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase()) || g.code.toLowerCase().includes(search.toLowerCase())
    const matchRsvp =
      filterRsvp === 'all'     ? true :
      filterRsvp === 'pending' ? g.rsvp_attending === null :
      filterRsvp === 'yes'     ? g.rsvp_attending === true :
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
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={openBulk}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '6px' }}>
              <path d="M7 1v8M3 5l4-4 4 4M1 11h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Carga masiva
          </button>
          <button className="btn-primary" onClick={openNew}>+ Nuevo invitado</button>
        </div>
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
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text)', fontWeight: 400 }}>{g.name}</p>
                  {g.email && <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)' }}>{g.email}</p>}
                  {g.rsvp_plus_one_name && (
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
                      + {g.rsvp_plus_one_name}
                    </p>
                  )}
                </div>

                <code style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--olive)', background: 'var(--cream)', padding: '3px 8px', borderRadius: '3px', border: '1px solid var(--sand)' }}>
                  {g.code}
                </code>

                <span style={{ fontSize: '16px', textAlign: 'center' }}>
                  {g.allow_plus_one ? '✓' : '–'}
                </span>

                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: badge.bg, color: badge.color,
                  padding: '4px 8px', borderRadius: '3px', whiteSpace: 'nowrap',
                }}>
                  {badge.label}
                </span>

                <span title={g.rsvp_message ?? ''} style={{ fontSize: '16px', textAlign: 'center', cursor: g.rsvp_message ? 'help' : 'default' }}>
                  {g.rsvp_message ? <ChatIcon size={14} color='var(--olive)' strokeWidth={1.5} /> : <span style={{ color: 'var(--muted)', fontSize: '14px' }}>–</span>}
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => copyLink(g.code)}
                    title="Copiar link de invitación"
                    style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    {copied === g.code ? <CheckIcon size={14} color='var(--olive)' strokeWidth={2.5} /> : <LinkIcon size={14} color='var(--olive)' strokeWidth={1.5} />}
                  </button>
                  <button
                    onClick={() => openEdit(g)}
                    title="Editar"
                    style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    <EditIcon size={14} color='var(--olive)' strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    title="Eliminar"
                    disabled={deleting === g.id}
                    style={{ padding: '6px 8px', background: 'none', border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer', opacity: deleting === g.id ? 0.4 : 1 }}
                  >
                    <TrashIcon size={14} color='var(--olive)' strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* RSVP notes */}
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

      {/* ─── Single guest modal ─────────────────────── */}
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
          <div style={{
            background: 'var(--warm)', borderRadius: '4px', padding: '32px',
            width: '100%', maxWidth: 440,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'fade-up 0.2s ease-out both',
          }}>
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

              {error && <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#8B2020' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline" style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar invitado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Bulk import modal ──────────────────────── */}
      {showBulk && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget && !bulkImporting) setShowBulk(false) }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(58,58,40,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', zIndex: 50,
            animation: 'fade-in 0.15s ease-out both',
          }}
        >
          <div style={{
            background: 'var(--warm)', borderRadius: '4px', padding: '32px',
            width: '100%', maxWidth: bulkStep === 'preview' ? 680 : 520,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'fade-up 0.2s ease-out both',
            maxHeight: '90vh', overflowY: 'auto',
          }}>

            {/* Step: input */}
            {bulkStep === 'input' && (
              <>
                <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '24px', color: 'var(--olive)', marginBottom: '6px' }}>
                  Carga masiva de invitados
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.55 }}>
                  Pega la lista de invitados, uno por línea. Formato:
                </p>

                <div style={{ background: 'var(--cream)', border: '1px solid var(--sand)', borderRadius: '3px', padding: '12px 16px', marginBottom: '20px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--olive)', lineHeight: 1.8 }}>
                  <div>Nombre Apellido</div>
                  <div>Nombre Apellido, email@ejemplo.com</div>
                  <div>Nombre Apellido, , true&nbsp;&nbsp;<span style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '11px' }}>← con +1</span></div>
                  <div>Nombre Apellido, email@ejemplo.com, true</div>
                </div>

                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={'María González\nCarlos Rodríguez, carlos@email.com\nAna Martínez, ana@email.com, true'}
                  rows={10}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    lineHeight: 1.7,
                    marginBottom: '20px',
                  }}
                  autoFocus
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowBulk(false)}
                    className="btn-outline"
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkPreview}
                    className="btn-primary"
                    style={{ flex: 2 }}
                    disabled={!parseBulkText(bulkText).length}
                  >
                    Vista previa ({parseBulkText(bulkText).length} invitados)
                  </button>
                </div>
              </>
            )}

            {/* Step: preview */}
            {bulkStep === 'preview' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '24px', color: 'var(--olive)', marginBottom: '4px' }}>
                      Vista previa
                    </h2>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>
                      {bulkRows.length} invitados listos para importar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkStep('input')}
                    style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--olive)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', paddingTop: '4px' }}
                  >
                    ← Editar
                  </button>
                </div>

                {/* Preview table */}
                <div style={{ border: '1px solid var(--sand)', borderRadius: '4px', overflow: 'hidden', marginBottom: '20px' }}>
                  {/* Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 1.5fr 60px',
                    padding: '8px 14px',
                    background: 'var(--cream)',
                    borderBottom: '1px solid var(--sand)',
                  }}>
                    {['Nombre', 'Código', 'Email', '+1'].map((h) => (
                      <span key={h} style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Rows */}
                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {bulkRows.map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1.2fr 1.5fr 60px',
                          padding: '10px 14px',
                          alignItems: 'center',
                          borderBottom: i < bulkRows.length - 1 ? '1px solid var(--sand)' : 'none',
                          background: 'var(--warm)',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text)' }}>
                          {r.name}
                        </span>
                        <code style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--olive)', background: 'var(--cream)', padding: '2px 6px', borderRadius: '3px', border: '1px solid var(--sand)' }}>
                          {r.code}
                        </code>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.email || '–'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: r.allow_plus_one ? 'var(--olive)' : 'var(--muted)', textAlign: 'center' }}>
                          {r.allow_plus_one ? '✓' : '–'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBulkImport}
                  className="btn-primary"
                  style={{ width: '100%' }}
                  disabled={bulkImporting}
                >
                  {bulkImporting ? 'Importando...' : `Importar ${bulkRows.length} invitados`}
                </button>
              </>
            )}

            {/* Step: done */}
            {bulkStep === 'done' && bulkResult && (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>
                  {bulkResult.failed === 0 ? '✓' : '⚠'}
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '26px', color: 'var(--olive)', marginBottom: '12px' }}>
                  {bulkResult.failed === 0 ? 'Importación completada' : 'Importación con errores'}
                </h2>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '28px' }}>
                  {bulkResult.ok > 0 && <><strong style={{ color: 'var(--olive)' }}>{bulkResult.ok}</strong> invitados importados correctamente.<br /></>}
                  {bulkResult.failed > 0 && <><strong style={{ color: '#8B2020' }}>{bulkResult.failed}</strong> no pudieron importarse (código duplicado u otro error).</>}
                </p>
                <button
                  type="button"
                  onClick={() => setShowBulk(false)}
                  className="btn-primary"
                  style={{ minWidth: '160px' }}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
