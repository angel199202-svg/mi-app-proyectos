'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CelebrationIcon, HeartEnvelopeIcon } from '../components/Icons'

type Guest = {
  id: string
  name: string
  code: string
  allow_plus_one: boolean
  rsvp_attending: boolean | null
  rsvp_plus_one: boolean | null
  rsvp_plus_one_name: string | null
  rsvp_message: string | null
}

type Step = 'code' | 'invitation' | 'form' | 'done'

export default function InvitacionPage() {
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guest, setGuest] = useState<Guest | null>(null)

  /* form state */
  const [attending, setAttending] = useState<boolean | null>(null)
  const [plusOne, setPlusOne] = useState(false)
  const [plusOneName, setPlusOneName] = useState('')
  const [dietary, setDietary] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('wedding_guests')
      .select('id, name, code, allow_plus_one, rsvp_attending, rsvp_plus_one, rsvp_plus_one_name, rsvp_message')
      .eq('code', code.trim().toUpperCase())
      .single()

    setLoading(false)

    if (err || !data) {
      setError('Código no encontrado. Verifica que esté escrito exactamente como aparece en tu invitación.')
      return
    }

    setGuest(data)

    if (data.rsvp_attending !== null) {
      /* already responded */
      setAttending(data.rsvp_attending)
      setPlusOne(data.rsvp_plus_one ?? false)
      setPlusOneName(data.rsvp_plus_one_name ?? '')
      setMessage(data.rsvp_message ?? '')
      setStep('done')
    } else {
      setStep('invitation')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!guest || attending === null) return

    setSubmitting(true)

    const { error: err } = await supabase
      .from('wedding_guests')
      .update({
        rsvp_attending: attending,
        rsvp_plus_one: attending && guest.allow_plus_one ? plusOne : false,
        rsvp_plus_one_name: plusOne && plusOneName.trim() ? plusOneName.trim() : null,
        rsvp_dietary: dietary.trim() || null,
        rsvp_message: message.trim() || null,
        rsvp_at: new Date().toISOString(),
      })
      .eq('id', guest.id)

    setSubmitting(false)

    if (err) {
      setError('Hubo un error al guardar tu respuesta. Inténtalo de nuevo.')
      return
    }

    setStep('done')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontFamily: 'var(--font-body)',
    fontSize: '15px',
    background: 'var(--warm)',
    border: '1.5px solid var(--sand)',
    borderRadius: '3px',
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '10px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'var(--muted)',
    display: 'block',
    marginBottom: '8px',
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      {/* Back link */}
      <Link
        href="/"
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--olive)',
          opacity: 0.65,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M13 7H1M6 2L1 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        Inicio
      </Link>

      <div style={{ width: '100%', maxWidth: 480, animation: 'fade-up 0.6s ease-out both' }}>

        {/* STEP: code entry */}
        {step === 'code' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-script)', fontSize: '48px', color: 'var(--olive)', marginBottom: '8px' }}>
              Tu invitación
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muted)', marginBottom: '48px' }}>
              Ingresa el código que encontrarás en tu tarjeta
            </p>

            <form onSubmit={handleLookup}>
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label style={labelStyle}>Código de invitación</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError('') }}
                  placeholder="Ej: ANGEL-001"
                  style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', fontSize: '18px' }}
                  autoFocus
                  autoCapitalize="characters"
                />
              </div>
              {error && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#8B2020', marginBottom: '16px', lineHeight: 1.5 }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={loading || !code.trim()}
              >
                {loading ? 'Buscando...' : 'Ver mi invitación'}
              </button>
            </form>
          </div>
        )}

        {/* STEP: show invitation */}
        {step === 'invitation' && guest && (
          <div style={{ textAlign: 'center' }}>
            {/* Invitation card */}
            <div
              style={{
                background: 'var(--warm)',
                border: '1px solid var(--sand)',
                borderRadius: '4px',
                padding: '48px 36px',
                marginBottom: '32px',
                position: 'relative',
                boxShadow: '0 12px 40px rgba(106,107,75,0.12)',
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--rose)', opacity: 0.7 }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
                La Boda Pandaneiros · Invitación personal
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '17px', color: 'var(--muted)', marginBottom: '8px' }}>
                Con mucho amor, invitamos a
              </p>
              <h1 style={{ fontFamily: 'var(--font-script)', fontSize: '40px', color: 'var(--olive)', marginBottom: '16px', lineHeight: 1.2 }}>
                {guest.name}
              </h1>
              <div style={{ width: '40px', height: '1px', background: 'var(--rose)', margin: '0 auto 16px', opacity: 0.7 }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--text)', opacity: 0.8, marginBottom: '4px' }}>
                a celebrar nuestra boda
              </p>
              <p style={{ fontFamily: 'var(--font-script)', fontSize: '32px', color: 'var(--olive)' }}>
                Angel &amp; Milagros
              </p>
              {guest.allow_plus_one && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '20px', padding: '10px 16px', background: 'var(--cream)', borderRadius: '3px' }}>
                  Esta invitación incluye un acompañante
                </p>
              )}
            </div>

            <button
              className="btn-primary"
              style={{ width: '100%', marginBottom: '12px' }}
              onClick={() => setStep('form')}
            >
              Confirmar mi asistencia
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>
              Por favor responde antes del{' '}
              <span style={{ color: 'var(--olive)', fontWeight: 700 }}>[Fecha límite RSVP]</span>
              {/* TODO: reemplaza con la fecha real */}
            </p>
          </div>
        )}

        {/* STEP: RSVP form */}
        {step === 'form' && guest && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <p style={{ fontFamily: 'var(--font-script)', fontSize: '40px', color: 'var(--olive)' }}>
                {guest.name}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '15px', color: 'var(--muted)' }}>
                Confirma tu respuesta
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Attendance */}
              <div style={{ marginBottom: '28px' }}>
                <label style={labelStyle}>¿Asistirás?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { val: true,  label: 'Sí, asistiré',   icon: <CelebrationIcon size={28} color='var(--olive)' /> },
                    { val: false, label: 'No podré asistir', icon: <HeartEnvelopeIcon size={28} color='var(--olive)' /> },
                  ].map(opt => (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => { setAttending(opt.val); if (!opt.val) setPlusOne(false) }}
                      style={{
                        padding: '18px 12px',
                        borderRadius: '3px',
                        border: attending === opt.val ? '2px solid var(--olive)' : '1.5px solid var(--sand)',
                        background: attending === opt.val ? 'var(--olive)' : 'var(--warm)',
                        color: attending === opt.val ? 'var(--cream)' : 'var(--text)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                      }}
                    >
                      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{opt.icon}</div>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plus one */}
              {attending === true && guest.allow_plus_one && (
                <div style={{ marginBottom: '28px' }}>
                  <label style={labelStyle}>¿Traerás acompañante?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    {[
                      { val: true,  label: 'Sí, vendré acompañado/a' },
                      { val: false, label: 'Vendré solo/a' },
                    ].map(opt => (
                      <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => setPlusOne(opt.val)}
                        style={{
                          padding: '14px 12px',
                          borderRadius: '3px',
                          border: plusOne === opt.val ? '2px solid var(--olive)' : '1.5px solid var(--sand)',
                          background: plusOne === opt.val ? 'var(--olive)' : 'var(--warm)',
                          color: plusOne === opt.val ? 'var(--cream)' : 'var(--text)',
                          fontFamily: 'var(--font-body)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.18s',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {plusOne && (
                    <div>
                      <label style={labelStyle}>Nombre del acompañante</label>
                      <input
                        type="text"
                        value={plusOneName}
                        onChange={(e) => setPlusOneName(e.target.value)}
                        placeholder="Nombre completo"
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Dietary */}
              {attending === true && (
                <div style={{ marginBottom: '28px' }}>
                  <label style={labelStyle}>Restricciones alimentarias (opcional)</label>
                  <input
                    type="text"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="Ej: vegetariano, alérgico a los mariscos"
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Message */}
              <div style={{ marginBottom: '32px' }}>
                <label style={labelStyle}>Mensaje para los novios (opcional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Déjanos un mensaje..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {error && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#8B2020', marginBottom: '16px' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%' }}
                disabled={submitting || attending === null}
              >
                {submitting ? 'Guardando...' : 'Confirmar respuesta'}
              </button>
            </form>
          </div>
        )}

        {/* STEP: done */}
        {step === 'done' && guest && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                background: 'var(--warm)',
                border: '1px solid var(--sand)',
                borderRadius: '4px',
                padding: '48px 36px',
                marginBottom: '32px',
                boxShadow: '0 12px 40px rgba(106,107,75,0.12)',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                {attending ? '🎉' : '💌'}
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '28px', color: 'var(--olive)', marginBottom: '16px' }}>
                {attending ? '¡Gracias! Te esperamos' : 'Gracias por avisarnos'}
              </h2>
              <div style={{ width: '40px', height: '1px', background: 'var(--rose)', margin: '0 auto 20px', opacity: 0.7 }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--muted)', lineHeight: 1.65 }}>
                {attending
                  ? `¡Estamos muy felices de que puedas acompañarnos, ${guest.name}! Pronto recibirás más detalles.`
                  : `Lamentamos que no puedas estar, ${guest.name}. Te llevaremos en nuestros corazones ese día.`}
              </p>
            </div>
            <Link href="/" className="btn-outline">
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
