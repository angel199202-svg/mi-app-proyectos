'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CelebrationIcon, HeartEnvelopeIcon, AttendingIcon } from '../components/Icons'

type Guest = {
  id: string
  name: string
  code: string
  max_adults: number
  max_children: number
  rsvp_attending: boolean | null
  rsvp_plus_one: boolean | null
  rsvp_plus_one_name: string | null
  rsvp_message: string | null
}

type Step = 'code' | 'invitation' | 'form' | 'done'

function InvitacionContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('code')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [guest, setGuest] = useState<Guest | null>(null)

  const [attending, setAttending] = useState<boolean | null>(null)
  const [adultsCount, setAdultsCount] = useState(1)
  const [childrenCount, setChildrenCount] = useState(0)
  const [companionNames, setCompanionNames] = useState<string[]>([])
  const [dietary, setDietary] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Auto-lookup when ?code= is present in URL
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode && step === 'code') {
      setCode(urlCode.toUpperCase())
      lookupCode(urlCode.toUpperCase())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep companion names array in sync with extra adults (titular not counted)
  const extraAdults = Math.max(0, adultsCount - 1)
  useEffect(() => {
    setCompanionNames((prev) => {
      const arr = [...prev]
      while (arr.length < extraAdults) arr.push('')
      return arr.slice(0, extraAdults)
    })
  }, [extraAdults])

  async function lookupCode(raw: string) {
    if (!raw.trim()) return
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('wedding_guests')
      .select('id, name, code, max_adults, max_children, rsvp_attending, rsvp_plus_one, rsvp_plus_one_name, rsvp_message')
      .eq('code', raw.trim().toUpperCase())
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
      setAdultsCount(1 + names.length)
      setCompanionNames(names)
      setMessage(data.rsvp_message ?? '')
      setStep('done')
    } else {
      setAdultsCount(data.max_adults)
      setChildrenCount(0)
      setStep('invitation')
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    await lookupCode(code)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!guest || attending === null) return
    setSubmitting(true)

    const filledNames = companionNames.filter((n) => n.trim())
    const hasOthers = attending && (adultsCount > 1 || childrenCount > 0)

    const { error: err } = await supabase
      .from('wedding_guests')
      .update({
        rsvp_attending:     attending,
        rsvp_plus_one:      hasOthers,
        rsvp_plus_one_name: hasOthers && filledNames.length > 0 ? filledNames.join(', ') : null,
        rsvp_dietary:       dietary.trim() || null,
        rsvp_message:       message.trim() || null,
        rsvp_at:            new Date().toISOString(),
      })
      .eq('id', guest.id)

    setSubmitting(false)
    if (err) { setError('Hubo un error al guardar tu respuesta. Inténtalo de nuevo.'); return }
    setStep('done')
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: step === 'invitation' ? 'flex-start' : 'center',
      justifyContent: 'center',
      padding: step === 'invitation' ? '0' : '40px 24px',
    }}>
      <Link href="/" style={{ position: 'fixed', top: '24px', left: '24px', fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--olive)', opacity: 0.6, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M13 7H1M6 2L1 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        Inicio
      </Link>

      <div style={{ width: '100%', maxWidth: step === 'invitation' ? '100%' : 480, animation: 'fade-up 0.6s ease-out both' }}>

        {/* STEP: code entry */}
        {step === 'code' && (
          <div style={{ textAlign: 'center' }}>
            <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', opacity: 0.6 }}>
              <div style={{ width: '48px', height: '1px', background: 'var(--rose)' }} />
              <div style={{ width: '5px', height: '5px', background: 'var(--rose)', borderRadius: '50%' }} />
              <div style={{ width: '48px', height: '1px', background: 'var(--rose)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-script)', fontSize: '48px', color: 'var(--olive)', marginBottom: '8px' }}>Tu invitación</p>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muted)', marginBottom: '44px' }}>
              Ingresa el código que encontrarás en tu tarjeta
            </p>
            <form onSubmit={handleLookup}>
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label className="invite-label">Código de invitación</label>
                <input type="text" value={code}
                  onChange={(e) => { setCode(e.target.value); setError('') }}
                  placeholder="Ej: GONZ-123" className="invite-field"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', fontSize: '18px' }}
                  autoFocus autoCapitalize="characters" />
              </div>
              {error && <p className="invite-error">{error}</p>}
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading || !code.trim()}>
                {loading ? 'Buscando...' : 'Ver mi invitación'}
              </button>
            </form>
          </div>
        )}

        {/* STEP: show invitation — scroll journey */}
        {step === 'invitation' && guest && (
          <div style={{ textAlign: 'center' }}>

            {/* ① Hero — ocupa toda la pantalla */}
            <section style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 60px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '32px' }}>
                Boda Pandaneiros &nbsp;·&nbsp; Invitación personal
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '18px', color: 'var(--muted)', marginBottom: '8px' }}>
                Con mucho amor, invitamos a
              </p>
              <h1 style={{ fontFamily: 'var(--font-script)', fontSize: 'clamp(44px, 10vw, 72px)', color: 'var(--olive)', lineHeight: 1.15, marginBottom: '20px' }}>
                {guest.name}
              </h1>
              <div style={{ width: '48px', height: '1px', background: 'var(--rose)', margin: '0 auto 20px' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--text)', opacity: 0.75, marginBottom: '6px' }}>
                a celebrar nuestra boda
              </p>
              <p style={{ fontFamily: 'var(--font-script)', fontSize: 'clamp(32px, 8vw, 52px)', color: 'var(--olive)' }}>
                Angel &amp; Milagros
              </p>

              {/* Scroll hint */}
              <div style={{ marginTop: '56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', animation: 'pulse-soft 2.5s ease-in-out infinite', opacity: 0.55 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--olive)' }}>
                  Desliza para ver los detalles
                </p>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M4 9l4 4 4-4" stroke="var(--olive)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </section>

            {/* ② Fecha y lugar */}
            <section style={{ padding: '80px 24px', background: 'var(--warm)', borderTop: '1px solid var(--sand)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
                Cuándo y dónde
              </p>
              <p style={{ fontFamily: 'var(--font-script)', fontSize: 'clamp(40px, 9vw, 64px)', color: 'var(--olive)', lineHeight: 1.1, marginBottom: '16px' }}>
                17 · 07 · 2026
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '20px', color: 'var(--text)', opacity: 0.8, marginBottom: '32px' }}>
                Viernes · 16:00 hrs
              </p>
              <div style={{ width: '32px', height: '1px', background: 'var(--rose)', margin: '0 auto 32px' }} />
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '22px', color: 'var(--olive)', marginBottom: '6px' }}>
                Residencias Valle Alto
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                Valencia, Estado Carabobo
              </p>
            </section>

            {/* ③ Vestimenta */}
            <section style={{ padding: '80px 24px', background: 'var(--cream)', borderTop: '1px solid var(--sand)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>
                Vestimenta
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(24px, 5vw, 36px)', color: 'var(--olive)', marginBottom: '16px' }}>
                Semi formal · Chic garden
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.65, maxWidth: '320px', margin: '0 auto' }}>
                Colores suaves, naturales o pasteles. Evita tonos muy oscuros o demasiado casuales.
              </p>
            </section>

            {/* ④ Tu invitación — cuántas personas */}
            <section style={{ padding: '80px 24px', background: 'var(--warm)', borderTop: '1px solid var(--sand)' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>
                Tu invitación incluye
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(28px, 6vw, 44px)', color: 'var(--olive)', lineHeight: 1.2 }}>
                {guest.max_adults} Adulto{guest.max_adults !== 1 ? 's' : ''}
                {guest.max_children > 0 && (
                  <span> · {guest.max_children} Niño{guest.max_children !== 1 ? 's' : ''}</span>
                )}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '15px', color: 'var(--muted)', marginTop: '12px' }}>
                {guest.max_adults + guest.max_children} {guest.max_adults + guest.max_children === 1 ? 'persona' : 'personas'} en total
              </p>
            </section>

            {/* ⑤ CTA — confirmar */}
            <section style={{ padding: '80px 24px 100px', background: 'var(--cream)', borderTop: '1px solid var(--sand)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '18px', color: 'var(--muted)', marginBottom: '32px', lineHeight: 1.5 }}>
                Nos hace muy felices tenerte con nosotros.<br />Por favor confirma tu asistencia.
              </p>
              <button
                className="btn-primary"
                style={{ minWidth: '260px', marginBottom: '16px' }}
                onClick={() => setStep('form')}
              >
                Confirmar mi asistencia
              </button>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)' }}>
                Antes del <span style={{ color: 'var(--olive)', fontWeight: 700 }}>01 de Julio, 2026</span>
              </p>
            </section>

          </div>
        )}

        {/* STEP: RSVP form */}
        {step === 'form' && guest && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <p style={{ fontFamily: 'var(--font-script)', fontSize: '40px', color: 'var(--olive)' }}>{guest.name}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '15px', color: 'var(--muted)' }}>Confirma tu respuesta</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Attendance */}
              <div style={{ marginBottom: '28px' }}>
                <label className="invite-label">¿Asistirán?</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { val: true,  label: 'Sí, asistiremos',  icon: <CelebrationIcon size={24} /> },
                    { val: false, label: 'No podremos asistir', icon: <HeartEnvelopeIcon size={24} /> },
                  ].map((opt) => (
                    <button key={String(opt.val)} type="button"
                      onClick={() => { setAttending(opt.val); if (!opt.val) { setAdultsCount(1); setChildrenCount(0) } }}
                      className={`attend-btn${attending === opt.val ? ' is-selected' : ''}`}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {attending === true && (
                <div style={{ background: 'var(--warm)', border: '1px solid var(--sand)', borderRadius: '3px', padding: '20px', marginBottom: '28px' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '20px' }}>
                    ¿Cuántos asistirán?
                  </p>

                  {/* Adults row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: guest.max_children > 0 ? '20px' : '0' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text)', fontWeight: 400 }}>Adultos</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)' }}>máx. {guest.max_adults}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button type="button"
                        onClick={() => setAdultsCount(Math.max(1, adultsCount - 1))}
                        style={{ width: '32px', height: '32px', border: '1.5px solid var(--sand)', background: 'var(--cream)', borderRadius: '3px', cursor: 'pointer', fontSize: '18px', color: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        −
                      </button>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 300, color: 'var(--olive)', minWidth: '32px', textAlign: 'center' }}>
                        {adultsCount}
                      </span>
                      <button type="button"
                        onClick={() => setAdultsCount(Math.min(guest.max_adults, adultsCount + 1))}
                        style={{ width: '32px', height: '32px', border: '1.5px solid var(--sand)', background: 'var(--cream)', borderRadius: '3px', cursor: 'pointer', fontSize: '18px', color: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children row */}
                  {guest.max_children > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text)', fontWeight: 400 }}>Niños</p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--muted)' }}>máx. {guest.max_children}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button type="button"
                          onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))}
                          style={{ width: '32px', height: '32px', border: '1.5px solid var(--sand)', background: 'var(--cream)', borderRadius: '3px', cursor: 'pointer', fontSize: '18px', color: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          −
                        </button>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 300, color: 'var(--olive)', minWidth: '32px', textAlign: 'center' }}>
                          {childrenCount}
                        </span>
                        <button type="button"
                          onClick={() => setChildrenCount(Math.min(guest.max_children, childrenCount + 1))}
                          style={{ width: '32px', height: '32px', border: '1.5px solid var(--sand)', background: 'var(--cream)', borderRadius: '3px', cursor: 'pointer', fontSize: '18px', color: 'var(--olive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          +
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Running total */}
                  {(adultsCount + childrenCount) > 1 && (
                    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '14px', color: 'var(--muted)', textAlign: 'center', marginTop: '16px', borderTop: '1px solid var(--sand)', paddingTop: '12px' }}>
                      {adultsCount} adulto{adultsCount !== 1 ? 's' : ''}
                      {childrenCount > 0 && ` · ${childrenCount} niño${childrenCount !== 1 ? 's' : ''}`}
                      {' — '}{adultsCount + childrenCount} personas en total
                    </p>
                  )}
                </div>
              )}

              {/* Companion names (extra adults only) */}
              {attending === true && extraAdults > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <label className="invite-label">Nombre{extraAdults > 1 ? 's' : ''} del acompañante{extraAdults > 1 ? 's' : ''} adulto{extraAdults > 1 ? 's' : ''}</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Array.from({ length: extraAdults }, (_, i) => (
                      <input key={i} type="text"
                        value={companionNames[i] ?? ''}
                        onChange={(e) => {
                          const names = [...companionNames]
                          names[i] = e.target.value
                          setCompanionNames(names)
                        }}
                        placeholder={extraAdults === 1 ? 'Nombre completo' : `Adulto ${i + 2} — nombre completo`}
                        className="invite-field" />
                    ))}
                  </div>
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
                {attending ? <AttendingIcon size={44} strokeWidth={1.2} /> : <HeartEnvelopeIcon size={44} strokeWidth={1.2} />}
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '28px', color: 'var(--olive)', marginBottom: '16px' }}>
                {attending ? '¡Gracias! Los esperamos' : 'Gracias por avisarnos'}
              </h2>
              <div style={{ width: '48px', height: '1px', background: 'var(--rose)', margin: '0 auto 20px' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--muted)', lineHeight: 1.65 }}>
                {attending
                  ? `¡Estamos muy felices de que puedan acompañarnos, ${guest.name}! Pronto recibirán más detalles.`
                  : `Lamentamos que no puedan estar, ${guest.name}. Los llevaremos en nuestros corazones ese día.`}
              </p>
              {attending && (adultsCount + childrenCount) > 0 && (
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '16px', color: 'var(--olive)', marginTop: '16px', opacity: 0.8 }}>
                  {adultsCount} Adulto{adultsCount !== 1 ? 's' : ''}
                  {childrenCount > 0 && <span> · {childrenCount} Niño{childrenCount !== 1 ? 's' : ''}</span>}
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

export default function InvitacionPage() {
  return (
    <Suspense>
      <InvitacionContent />
    </Suspense>
  )
}
