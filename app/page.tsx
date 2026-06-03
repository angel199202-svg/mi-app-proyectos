'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FloatingPetals } from './components/FloatingPetals'
import { RevealSection } from './components/RevealSection'
import { CalendarIcon, ClockIcon, PinIcon, HangerIcon, LeafIcon, PhoneOffIcon } from './components/Icons'
import { supabase } from '@/lib/supabase'

/* ─── SVG Decorations ───────────────────────────────── */
function BotanicalSprig({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 120" fill="none" aria-hidden="true">
      <line x1="30" y1="118" x2="30" y2="8" stroke="#6a6b4b" strokeWidth="1" opacity="0.6" />
      <path d="M30,95 Q12,78 4,58 Q18,72 30,78" fill="#6a6b4b" opacity="0.45" />
      <path d="M30,95 Q48,78 56,58 Q42,72 30,78" fill="#6a6b4b" opacity="0.38" />
      <path d="M30,62 Q8,44 1,22 Q16,40 30,47" fill="#6a6b4b" opacity="0.38" />
      <path d="M30,62 Q52,44 59,22 Q44,40 30,47" fill="#6a6b4b" opacity="0.32" />
      <circle cx="30" cy="10" r="7" fill="#d1beb0" opacity="0.8" />
      <circle cx="30" cy="10" r="4" fill="#c4bfac" opacity="0.9" />
      <circle cx="30" cy="10" r="2" fill="#6a6b4b" opacity="0.5" />
    </svg>
  )
}

function FlowerDivider() {
  return (
    <div className="divider-line my-8" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3" fill="#d1beb0" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <ellipse
            key={i}
            cx="11"
            cy="5.5"
            rx="2"
            ry="4"
            fill="#d1beb0"
            opacity="0.65"
            transform={`rotate(${deg} 11 11)`}
          />
        ))}
        <circle cx="11" cy="11" r="2.5" fill="#c4bfac" />
      </svg>
    </div>
  )
}

function RingsIcon() {
  return (
    <svg width="40" height="24" viewBox="0 0 40 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#6a6b4b" strokeWidth="1.5" opacity="0.5" />
      <circle cx="28" cy="12" r="10" stroke="#6a6b4b" strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

/* ─── Envelope Opening ──────────────────────────────── */
function EnvelopeOverlay({ onDone }: { onDone: () => void }) {
  const [opened, setOpened] = useState(false)
  const [exiting, setExiting] = useState(false)

  const handleOpen = () => {
    if (opened) return
    setOpened(true)
    setTimeout(() => {
      setExiting(true)
      setTimeout(onDone, 750)
    }, 1600)
  }

  return (
    <div
      className={`envelope-overlay${exiting ? ' is-exiting' : ''}`}
      role="dialog"
      aria-label="Abrir invitación"
    >
      <FloatingPetals />

      {/* Envelope */}
      <div className={`envelope-wrap${opened ? ' env-open' : ''}`}>
        {/* Body with fold decorations */}
        <div className="env-body">
          <div className="env-fold-l" />
          <div className="env-fold-r" />
          <div className="env-fold-b" />
        </div>

        {/* Top flap */}
        <div className="env-flap" />

        {/* Wax seal — click to open */}
        <button className="env-seal" onClick={handleOpen} aria-label="Abrir carta">
          P
        </button>

        {/* Card that slides up */}
        <div className="env-card">
          <p
            style={{
              fontFamily: 'var(--font-script)',
              fontSize: '13px',
              color: 'var(--muted)',
              letterSpacing: '0.04em',
              marginBottom: '6px',
            }}
          >
            La Boda Pandaneiros
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'var(--olive)',
              lineHeight: 1.2,
              margin: '4px 0',
            }}
          >
            Angel &amp; Milagros
          </h2>
          <div style={{ width: '40px', height: '1px', background: 'var(--rose)', margin: '10px auto', opacity: 0.8 }} />
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              color: 'var(--muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Te invita a su encuentro
          </p>
        </div>
      </div>

      {/* Hint */}
      {!opened && (
        <p className="env-hint">Toca el sello para abrir tu invitación</p>
      )}
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────── */
export default function WeddingPage() {
  const [envelopeDone, setEnvelopeDone] = useState(false)
  const [previewPhotos, setPreviewPhotos] = useState<{ id: string; public_url: string; caption: string | null }[]>([])

  useEffect(() => {
    supabase
      .from('wedding_photos')
      .select('id, public_url, caption, is_featured')
      .order('is_featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .limit(6)
      .then(({ data }) => { if (data) setPreviewPhotos(data) })
  }, [])

  return (
    <>
      {!envelopeDone && <EnvelopeOverlay onDone={() => setEnvelopeDone(true)} />}

      <main
        style={{
          background: 'var(--cream)',
          minHeight: '100vh',
          animation: envelopeDone ? 'fade-in 0.6s ease-out both' : undefined,
          opacity: envelopeDone ? undefined : 0,
        }}
      >
        {/* ── HERO ──────────────────────────────────── */}
        <section
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 24px 60px',
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          {/* Subtle background gradient */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(209,190,176,0.2) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Botanical sprigs */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: '4%',
              top: '10%',
              opacity: 0.55,
              animation: 'float-gentle 4s ease-in-out infinite',
            }}
          >
            <BotanicalSprig style={{ width: 50, height: 100 }} />
          </div>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              right: '4%',
              top: '10%',
              opacity: 0.55,
              transform: 'scaleX(-1)',
              animation: 'float-gentle 4.5s 1s ease-in-out infinite',
            }}
          >
            <BotanicalSprig style={{ width: 50, height: 100 }} />
          </div>

          {/* Content */}
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--olive)',
                opacity: 0.65,
                marginBottom: '28px',
                animation: 'fade-up 0.9s 0.1s ease-out both',
              }}
            >
              La Boda Pandaneiros
            </p>

            <h1
              style={{
                fontFamily: 'var(--font-script)',
                fontSize: 'clamp(60px, 14vw, 96px)',
                color: 'var(--olive)',
                lineHeight: 1.05,
                margin: '0 0 8px',
                animation: 'fade-up 0.9s 0.25s ease-out both',
              }}
            >
              Angel
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '18px',
                color: 'var(--rose)',
                opacity: 0.9,
                margin: '0 0 4px',
                letterSpacing: '0.05em',
                animation: 'fade-up 0.9s 0.35s ease-out both',
              }}
            >
              &amp;
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-script)',
                fontSize: 'clamp(60px, 14vw, 96px)',
                color: 'var(--olive)',
                lineHeight: 1.05,
                margin: '0 0 40px',
                animation: 'fade-up 0.9s 0.45s ease-out both',
              }}
            >
              Milagros
            </h1>

            <FlowerDivider />

            {/* Date placeholder */}
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 300,
                color: 'var(--text)',
                opacity: 0.8,
                marginBottom: '8px',
                animation: 'fade-up 0.9s 0.6s ease-out both',
              }}
            >
              Viernes · 17 de Julio, 2026
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'var(--muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: '48px',
                animation: 'fade-up 0.9s 0.7s ease-out both',
              }}
            >
              16:00 hrs · Valencia, Venezuela
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                animation: 'fade-up 0.9s 0.85s ease-out both',
              }}
            >
              <Link href="/invitacion" className="btn-primary">
                Confirmar asistencia
              </Link>
              <Link href="/lugar" className="btn-outline">
                Ver el lugar
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              opacity: 0.4,
              animation: 'fade-in 1s 1.5s both',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '9px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--olive)',
              }}
            >
              Descubre más
            </span>
            <svg
              width="16"
              height="24"
              viewBox="0 0 16 24"
              fill="none"
              style={{ animation: 'scroll-bounce 1.6s ease-in-out infinite' }}
            >
              <path d="M8 0 L8 16 M2 10 L8 16 L14 10" stroke="#6a6b4b" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
        </section>

        {/* ── NUESTRA HISTORIA ──────────────────────── */}
        <section
          style={{
            background: 'var(--warm)',
            padding: '80px 24px',
          }}
        >
          <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
            <RevealSection>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--olive)',
                  opacity: 0.6,
                  marginBottom: '16px',
                }}
              >
                Nuestra historia
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 6vw, 48px)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: 'var(--olive)',
                  marginBottom: '32px',
                }}
              >
                Un encuentro que lo cambió todo
              </h2>
              <div className="divider-line" style={{ marginBottom: '32px' }}>
                <RingsIcon />
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '19px',
                  fontWeight: 300,
                  color: 'var(--text)',
                  lineHeight: 1.75,
                  opacity: 0.85,
                }}
              >
                {/* TODO: agrega tu historia aquí */}
                Lo que comenzó como una mirada se convirtió en la historia
                más hermosa que podríamos haber imaginado. Hoy, después de
                compartir cada momento que nos trajo hasta aquí, queremos
                celebrar este nuevo capítulo con las personas que amamos.
              </p>
            </RevealSection>
          </div>
        </section>

        {/* ── EL GRAN DÍA ───────────────────────────── */}
        <section style={{ padding: '80px 24px', background: 'var(--cream)' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <RevealSection>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--olive)',
                    opacity: 0.6,
                    marginBottom: '12px',
                  }}
                >
                  El gran día
                </p>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(30px, 5vw, 44px)',
                    fontWeight: 300,
                    fontStyle: 'italic',
                    color: 'var(--olive)',
                  }}
                >
                  Detalles del evento
                </h2>
              </div>
            </RevealSection>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
              }}
            >
              {[
                {
                  icon: <CalendarIcon size={28} color="var(--olive)" strokeWidth={1.3} />,
                  label: 'Fecha',
                  value: '17 de Julio, 2026',
                  sub: 'Viernes',
                },
                {
                  icon: <ClockIcon size={28} color="var(--olive)" strokeWidth={1.3} />,
                  label: 'Hora',
                  value: '16:00 hrs',
                  sub: 'Llegada sugerida: 30 min antes',
                },
                {
                  icon: <PinIcon size={28} color="var(--olive)" strokeWidth={1.3} />,
                  label: 'Lugar',
                  value: 'Res. Valle Alto',
                  sub: 'Valencia, Venezuela',
                },
              ].map((item, i) => (
                <RevealSection key={item.label} delay={i * 120}>
                  <div className="info-card">
                    <div
                      style={{
                        marginBottom: '12px',
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </div>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '9px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--muted)',
                        marginBottom: '8px',
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '22px',
                        fontWeight: 400,
                        color: 'var(--olive)',
                        marginBottom: '4px',
                      }}
                    >
                      {item.value}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        color: 'var(--muted)',
                      }}
                    >
                      {item.sub}
                    </p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONFIRMAR ASISTENCIA ──────────────────── */}
        <section
          style={{
            padding: '80px 24px',
            background: 'var(--olive)',
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
          }}
        >
          {/* Decorative background circles */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: '-80px', right: '-80px',
              width: '320px', height: '320px', borderRadius: '50%',
              background: 'rgba(209,190,176,0.08)',
            }} />
            <div style={{
              position: 'absolute', bottom: '-60px', left: '-60px',
              width: '240px', height: '240px', borderRadius: '50%',
              background: 'rgba(196,191,172,0.08)',
            }} />
          </div>

          <RevealSection>
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto' }}>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--rose)',
                  opacity: 0.85,
                  marginBottom: '16px',
                }}
              >
                Tu invitación personal
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 5vw, 42px)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: 'var(--cream)',
                  marginBottom: '20px',
                  lineHeight: 1.3,
                }}
              >
                ¿Tienes tu código de invitación?
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  color: 'var(--sand)',
                  opacity: 0.85,
                  lineHeight: 1.65,
                  marginBottom: '36px',
                }}
              >
                Cada invitado recibe un código único. Ingrésalo para ver tu
                invitación personalizada y confirmar tu asistencia.
              </p>
              <Link
                href="/invitacion"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--cream)',
                  color: 'var(--olive)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '14px 36px',
                  borderRadius: '2px',
                  textDecoration: 'none',
                  transition: 'background 0.2s, transform 0.15s',
                }}
              >
                Ver mi invitación
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </Link>
            </div>
          </RevealSection>
        </section>

        {/* ── EL LUGAR ─────────────────────────────── */}
        <section style={{ padding: '80px 24px', background: 'var(--warm)' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
            <RevealSection>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--olive)',
                  opacity: 0.6,
                  marginBottom: '12px',
                }}
              >
                El lugar
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(30px, 5vw, 44px)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: 'var(--olive)',
                  marginBottom: '24px',
                }}
              >
                Dónde nos encontramos
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  color: 'var(--muted)',
                  lineHeight: 1.65,
                  marginBottom: '12px',
                }}
              >
                Residencias Valle Alto
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  color: 'var(--text)',
                  opacity: 0.75,
                  marginBottom: '36px',
                }}
              >
                Valencia, Estado Carabobo · Venezuela
              </p>

              {/* Map embed */}
              <div style={{ width: '100%', height: '240px', borderRadius: '4px', overflow: 'hidden', marginBottom: '32px', position: 'relative' }}>
                <iframe
                  src="https://maps.google.com/maps?q=10.205088,-68.0246677&t=&z=16&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="240"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Residencias Valle Alto"
                />
              </div>

              <Link href="/lugar" className="btn-outline">
                Ver detalles del lugar
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* ── EL ENCUENTRO ─────────────────────────── */}
        <section style={{ padding: '80px 24px', background: 'var(--cream)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
            <RevealSection>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--olive)',
                  opacity: 0.6,
                  marginBottom: '12px',
                }}
              >
                Sobre la celebración
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(28px, 5vw, 42px)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: 'var(--olive)',
                  marginBottom: '24px',
                }}
              >
                Un encuentro íntimo
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '18px',
                  fontWeight: 300,
                  color: 'var(--text)',
                  lineHeight: 1.8,
                  opacity: 0.85,
                  marginBottom: '36px',
                }}
              >
                Nuestra boda no es una fiesta, es un encuentro. Queremos
                compartir este momento de manera íntima y significativa con
                cada uno de ustedes. La presencia de cada invitado es un
                regalo en sí mismo.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  marginBottom: '36px',
                }}
              >
                {[
                  { icon: <HangerIcon size={24} color='var(--olive)' strokeWidth={1.4} />, text: 'Vestimenta elegante' },
                  { icon: <LeafIcon size={24} color='var(--olive)' strokeWidth={1.4} />, text: 'Celebración íntima' },
                  { icon: <PhoneOffIcon size={24} color='var(--olive)' strokeWidth={1.4} />, text: 'Momento presente' },
                ].map((item) => (
                  <div
                    key={item.text}
                    style={{
                      background: 'var(--warm)',
                      border: '1px solid var(--sand)',
                      borderRadius: '4px',
                      padding: '20px 16px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--olive)', letterSpacing: '0.04em' }}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>

              <Link href="/lugar#condiciones" className="btn-outline">
                Leer las condiciones del evento
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* ── ÁLBUM ────────────────────────────────── */}
        <section
          style={{
            padding: '80px 24px',
            background: 'var(--sand)',
          }}
        >
          <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
            <RevealSection>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--olive)',
                  opacity: 0.7,
                  marginBottom: '12px',
                }}
              >
                Nuestros momentos
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(30px, 5vw, 44px)',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: 'var(--olive)',
                  marginBottom: '40px',
                }}
              >
                Nuestro álbum
              </h2>

              {/* Album preview grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginBottom: '36px',
                }}
              >
                {previewPhotos.length > 0
                  ? previewPhotos.map((photo, n) => (
                      <Link
                        key={photo.id}
                        href="/album"
                        style={{
                          aspectRatio: n % 3 === 0 ? '1 / 1.3' : '1 / 1',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          display: 'block',
                          background: 'var(--sand)',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.public_url}
                          alt={photo.caption ?? ''}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      </Link>
                    ))
                  : [1, 2, 3, 4, 5, 6].map((n) => (
                      <div
                        key={n}
                        style={{
                          aspectRatio: n % 3 === 0 ? '1 / 1.3' : '1 / 1',
                          background: n % 2 === 0 ? 'var(--rose)' : 'var(--cream)',
                          borderRadius: '3px',
                          opacity: 0.4,
                        }}
                      />
                    ))}
              </div>

              <Link href="/album" className="btn-primary">
                Ver álbum completo
              </Link>
            </RevealSection>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────── */}
        <footer
          style={{
            padding: '60px 24px',
            background: 'var(--olive)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-script)',
              fontSize: '52px',
              color: 'var(--cream)',
              opacity: 0.9,
              lineHeight: 1,
              marginBottom: '16px',
            }}
          >
            A &amp; M
          </div>
          <div
            style={{
              width: '40px',
              height: '1px',
              background: 'var(--rose)',
              margin: '0 auto 16px',
              opacity: 0.6,
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--sand)',
              opacity: 0.7,
              marginBottom: '8px',
            }}
          >
            Viernes · 17 de Julio, 2026
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'var(--cream)',
              opacity: 0.55,
            }}
          >
            Con todo nuestro amor · Angel &amp; Milagros
          </p>
        </footer>
      </main>
    </>
  )
}
