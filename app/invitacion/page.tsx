'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CelebrationIcon, HeartEnvelopeIcon, AttendingIcon } from '../components/Icons'

type Guest = {
  id: string
  name: string
  code: string
  max_companions: number
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

  const [attending, setAttending] = useState<boolean | null>(null)
  const [companionsCount, setCompanionsCount] = useState(0)
  const [companionNames, setCompanionNames] = useState<string[]>([])
  const [dietary, setDietary] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setCompanionNames((prev) => {
      const arr = [...prev]
      while (arr.length < companionsCount) arr.push('')
      return arr.slice(0, companionsCount)
    })
  }, [companionsCount])

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('wedding_guests')
      .select('id, name, code, max_companions, rsvp_attending, rsvp_plus_one, rsvp_plus_one_name, rsvp_message')
      .eq('code', code.trim().toUpperCase())
      .single()

    setLoading(false)

    if (err || !data) {
      setError('Código no encontrado. Verifica que esté escrito exactamente como aparece en tu invitación.')
      return
    }

    setGuest(data)

    if (data.rsvp_attending !== null) {
      setAttending(data.rsvp_attending)
      const names = data.rsvp_plus_one_name
        ? data.rsvp_plus_one_name.split(',').map((s: string) => s.trim())
        : []
      setCompanionsCount(names.length)
      setCompanionNames(names)
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

    const filledNames = companionNames.filter((n) => n.trim())

    const { error: err } = await supabase
      .from('wedding_guests')
      .update({
        rsvp_attending:     attending,
        rsvp_plus_one:      attending && companionsCount > 0,
        rsvp_plus_one_name: attending && filledNames.length > 0 ? filledNames.join(', ') : null,
        rsvp_dietary:       dietary.trim() || null,
        rsvp_message:       message.trim() || null,
        rsvp_at:            new Date().toISOString(),
      })
      .eq('id', guest.id)

    setSubmitting(false)

    if (err) {
      setError('Hubo un error al guardar tu respuesta. Inténtalo de nuevo.')
      return
    }

    setStep('done')
  }

  const companionLabel = (n: number) =>
    n === 0 ? 'Ninguno' : n === 1 ? '1 acompañante' : `${n} acompañantes`

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--cream)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <Link
        href="/"
        style={{
          position: 'fixed', top: '24px', left: '24px',
          fontFamily: 'var(--font-body)', fontSize: '11px',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--olive)', opacity: 0.6, textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '6px',
          transition: 'opacity 0.2s',
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
            <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', opacity: 0.6 }}>
              <div style={{ width: '48px', height: '1px', background: 'var(--rose)' }} />
              <div style={{ width: '5px', height: '5px', background: 'var(--rose)', borderRadius: '50%' }} />
              <div style={{ width: '48px', height: '1px', background: 'var(--rose)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-script)', fontSize: '48px', color: 'var(--olive)', marginBottom: '8px' }}>
              Tu invitación
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muted)', marginBottom: '44px' }}>
              Ingresa el código que encontrarás en tu tarjeta
            </p>
            <form onSubmit={handleLookup}>
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label className="invite-label">Código de invitación</label>
                <input
                  type="text" value={code}
                  onChange={(e) => { setCode(e.target.value); setError('') }}
                  placeholder="Ej: ANGEL-001"
                  className="invite-field"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', fontSize: '18px' }}
                  autoFocus autoCapitalize="characters"
                />
              </div>
              {error && <p className="invite-error">{error}</p>}
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || !code.trim()}>
                {loading ? 'Buscando...' : 'Ver mi invitación'}
              </button>
            </form>
          </div>
        )}

        {/* STEP: show invitation */}
        {step === 'invitation' && guest && (
          <div style={{ textAlign: 'center' }}>
            <div className="invite-card" style={{ marginBottom: '32px' }}>
              <div className="invite-card-bar" />

              <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '28px' }}>
                Boda Pandaneiros &nbsp;·&nbsp; Invitación personal
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '17px', color: 'var(--muted)', marginBottom: '8px' }}>
                Con mucho amor, invitamos a
              </p>
              <h1 style={{ fontFamily: 'var(--font-script)', fontSize: '44px', color: 'var(--olive)', marginBottom: '20px', lineHeight: 1.2 }}>
                {guest.name}
              </h1>
              <div style={{ width: '48px', height: '1px', background: 'var(--rose)', margin: '0 auto 20px' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', color: 'var(--text)', opacity: 0.8, marginBottom: '4px' }}>
                a celebrar nuestra boda
              </p>
              <p style={{ fontFamily: 'var(--font-script)', fontSize: '32px', color: 'var(--olive)' }}>
                Angel &amp; Milagros
              </p>

              {/* Companion count indicator */}
              {guest.max_companions > 0 && (
                <div style={{
                  marginTop: '24px', padding: '12px 20px',
                  background: 'var(--cream)', borderRadius: '3px',
                  border: '1px solid var(--sand)',
                }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '4px' }}>
                    Esta invitación incluye
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '18px', color: 'var(--olive)' }}>
                    {guest.max_companions === 1
                      ? 'un acompañante'
                      : `hasta ${guest.max_companions} acompañantes`}
                  </p>
                </div>
              )}
            </div>

            <button className="btn-primary" style={{ width: '100%', marginBottom: '12px' }} onClick={() => setStep('form')}>
              Confirmar mi asistencia
            </button>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>
              Por favor responde antes del{' '}
              <span style={{ color: 'var(--olive)', fontWeight: 700 }}>[Fecha límite RSVP]</span>
            </p>
          </div>
        )}

        {/* STEP: RSVP form */}
        {step === 'form' && guest && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <p style={{ fontFamily: 'var(--font-script)', fontSize: '40px', color: 'var(--olive)' }}>{guest.name}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '15px', color: 'var(--muted)' }}>
                Confirma tu respuesta
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Attendance */}
              <div style={{ marginBottom: '28px' }}>
                <label className="invite-label">¿Asistirás?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { val: true,  label: 'Sí, asistiré',     icon: <CelebrationIcon size={24} /> },
                    { val: false, label: 'No podré asistir',  icon: <HeartEnvelopeIcon size={24} /> },
                  ].map((opt) => (
                    <button key={String(opt.val)} type="button"
                      onClick={() => { setAttending(opt.val); if (!opt.val) setCompanionsCount(0) }}
                      className={`attend-btn${attending === opt.val ? ' is-selected' : ''}`}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Companions */}
              {attending === true && guest.max_companions > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <label className="invite-label">
                    ¿Cuántos acompañantes traerás?{' '}
                    <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--muted)' }}>
                      (máx. {guest.max_companions})
                    </span>
                  </label>

                  {/* Count selector */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {Array.from({ length: guest.max_companions + 1 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCompanionsCount(i)}
                        className={`attend-btn${companionsCount === i ? ' is-selected' : ''}`}
                        style={{ flex: '0 0 auto', minWidth: '80px', padding: '12px 14px' }}
                      >
                        {companionLabel(i)}
                      </button>
                    ))}
                  </div>

                  {/* Name inputs */}
                  {companionsCount > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Array.from({ length: companionsCount }, (_, i) => (
                        <div key={i}>
                          <label className="invite-label">
                            {companionsCount === 1 ? 'Nombre del acompañante' : `Acompañante ${i + 1}`}
                          </label>
                          <input
                            type="text"
                            value={companionNames[i] ?? ''}
                            onChange={(e) => {
                              const names = [...companionNames]
                              names[i] = e.target.value
                              setCompanionNames(names)
                            }}
                            placeholder="Nombre completo"
                            className="invite-field"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dietary */}
              {attending === true && (
                <div style={{ marginBottom: '28px' }}>
                  <label className="invite-label">Restricciones alimentarias (opcional)</label>
                  <input type="text" value={dietary} onChange={(e) => setDietary(e.target.value)}
                    placeholder="Ej: vegetariano, alérgico a los mariscos" className="invite-field" />
                </div>
              )}

              {/* Message */}
              <div style={{ marginBottom: '32px' }}>
                <label className="invite-label">Mensaje para los novios (opcional)</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Déjanos un mensaje..." rows={3}
                  className="invite-field" style={{ resize: 'vertical' }} />
              </div>

              {error && <p className="invite-error">{error}</p>}

              <button type="submit" className="btn-primary" style={{ width: '100%' }}
                disabled={submitting || attending === null}>
                {submitting ? 'Guardando...' : 'Confirmar respuesta'}
              </button>
            </form>
          </div>
        )}

        {/* STEP: done */}
        {step === 'done' && guest && (
          <div style={{ textAlign: 'center' }}>
            <div className="invite-card" style={{ marginBottom: '32px' }}>
              <div className="invite-card-bar" />
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', color: 'var(--olive)', opacity: 0.75 }}>
                {attending
                  ? <AttendingIcon size={44} strokeWidth={1.2} />
                  : <HeartEnvelopeIcon size={44} strokeWidth={1.2} />
                }
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '28px', color: 'var(--olive)', marginBottom: '16px' }}>
                {attending ? '¡Gracias! Te esperamos' : 'Gracias por avisarnos'}
              </h2>
              <div style={{ width: '48px', height: '1px', background: 'var(--rose)', margin: '0 auto 20px' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--muted)', lineHeight: 1.65 }}>
                {attending
                  ? `¡Estamos muy felices de que puedas acompañarnos, ${guest.name}! Pronto recibirás más detalles.`
                  : `Lamentamos que no puedas estar, ${guest.name}. Te llevaremos en nuestros corazones ese día.`}
              </p>
              {attending && companionsCount > 0 && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginTop: '12px', fontStyle: 'italic' }}>
                  Vendrás con {companionLabel(companionsCount).toLowerCase()}.
                </p>
              )}
            </div>
            <Link href="/" className="btn-outline">Volver al inicio</Link>
          </div>
        )}
      </div>
    </div>
  )
}
