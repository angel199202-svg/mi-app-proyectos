'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Guest = {
  id: string
  name: string
  max_adults: number
  max_children: number
  rsvp_attending: boolean | null
  rsvp_adults: number | null
  rsvp_children: number | null
}

export default function ImprimirPage() {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [generatedAt] = useState(() => {
    const d = new Date()
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
  })

  useEffect(() => {
    supabase
      .from('wedding_guests')
      .select('id, name, max_adults, max_children, rsvp_attending, rsvp_adults, rsvp_children')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setGuests(data ?? [])
        setLoading(false)
      })
  }, [])

  const confirmed = guests.filter((g) => g.rsvp_attending === true)
  const pending   = guests.filter((g) => g.rsvp_attending === null)
  const declined  = guests.filter((g) => g.rsvp_attending === false)

  const totalAdults   = confirmed.reduce((s, g) => s + (g.rsvp_adults   ?? g.max_adults),   0)
  const totalChildren = confirmed.reduce((s, g) => s + (g.rsvp_children ?? g.max_children), 0)
  const totalPersons  = totalAdults + totalChildren

  function guestAdults(g: Guest)   { return g.rsvp_adults   ?? g.max_adults }
  function guestChildren(g: Guest) { return g.rsvp_children ?? g.max_children }

  const th: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--cream)',
    background: 'var(--olive)',
    padding: '10px 14px',
    textAlign: 'left',
  }

  const td: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    color: 'var(--text)',
    padding: '10px 14px',
    borderBottom: '1px solid var(--sand)',
  }

  const tdNum: React.CSSProperties = {
    ...td,
    fontFamily: 'var(--font-display)',
    fontSize: '17px',
    fontWeight: 300,
    color: 'var(--olive)',
    textAlign: 'center',
  }

  function GuestTable({ list, showEstimate }: { list: Guest[]; showEstimate?: boolean }) {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0' }}>
        <thead>
          <tr>
            <th style={th}>Nombre</th>
            <th style={{ ...th, textAlign: 'center', width: 80 }}>Adultos</th>
            <th style={{ ...th, textAlign: 'center', width: 80 }}>Niños</th>
            <th style={{ ...th, textAlign: 'center', width: 80 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {list.map((g, i) => {
            const adults   = guestAdults(g)
            const children = guestChildren(g)
            const isEst    = showEstimate && (g.rsvp_adults == null || g.rsvp_children == null)
            return (
              <tr key={g.id} style={{ background: i % 2 === 0 ? 'var(--cream)' : 'var(--warm)' }}>
                <td style={td}>
                  {g.name}
                  {isEst && (
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--muted)', marginLeft: 6 }}>
                      (máx.)
                    </span>
                  )}
                </td>
                <td style={tdNum}>{adults}</td>
                <td style={tdNum}>{children > 0 ? children : '—'}</td>
                <td style={{ ...tdNum, fontWeight: 600 }}>{adults + children}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  return (
    <>
      {/* Print styles — scope to this page */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          header { display: none !important; }
          main  { padding: 0 !important; max-width: 100% !important; }
          .print-page { padding: 0 !important; }
        }
        @media screen {
          .print-page { max-width: 860px; margin: 0 auto; }
        }
      `}</style>

      {/* Screen controls */}
      <div className="no-print" style={{ display: 'flex', gap: '12px', marginBottom: '28px', alignItems: 'center' }}>
        <Link href="/admin/invitados" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--olive)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M13 7H1M6 2L1 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Volver
        </Link>
        <button
          onClick={() => window.print()}
          style={{ marginLeft: 'auto', fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--olive)', color: 'var(--cream)', border: 'none', borderRadius: '3px', padding: '10px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M4 4V2h6v2M4 11v1h6v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          Imprimir / Guardar PDF
        </button>
      </div>

      {loading ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>Cargando…</p>
      ) : (
        <div className="print-page">

          {/* ── Letterhead ── */}
          <div style={{ textAlign: 'center', paddingBottom: '32px', borderBottom: '2px solid var(--olive)', marginBottom: '32px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
              Boda Pandaneiros
            </p>
            <p style={{ fontFamily: 'var(--font-script)', fontSize: '54px', color: 'var(--olive)', lineHeight: 1, marginBottom: '6px' }}>
              Angel &amp; Milagros
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muted)', marginBottom: '18px' }}>
              Viernes 17 de Julio, 2026 · 16:00 hrs · Valencia, Estado Carabobo
            </p>

            {/* Ornament */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <div style={{ width: '60px', height: '1px', background: 'var(--rose)' }} />
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1C6 1 3 3.5 3 6s3 5 3 5 3-2.5 3-5-3-5-3-5z" fill="var(--rose)" opacity=".6"/>
              </svg>
              <div style={{ width: '60px', height: '1px', background: 'var(--rose)' }} />
            </div>

            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '22px', color: 'var(--olive)', marginTop: '18px' }}>
              Lista de Invitados
            </p>
          </div>

          {/* ── Summary totals ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
            {[
              { label: 'Invitaciones',    value: guests.length },
              { label: 'Confirmados',     value: confirmed.length, highlight: true },
              { label: 'Adultos asisten', value: totalAdults },
              { label: 'Niños asisten',   value: totalChildren },
            ].map((s) => (
              <div key={s.label} style={{ border: `1.5px solid ${s.highlight ? 'var(--olive)' : 'var(--sand)'}`, borderRadius: '3px', padding: '14px', textAlign: 'center', background: s.highlight ? 'var(--olive)' : 'var(--warm)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: s.highlight ? 'rgba(255,255,255,0.7)' : 'var(--muted)', marginBottom: '6px' }}>
                  {s.label}
                </p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 300, color: s.highlight ? '#fff' : 'var(--olive)', lineHeight: 1 }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Confirmed ── */}
          {confirmed.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4a6741', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#4a6741' }} />
                Confirmados · {confirmed.length} invitaciones · {totalPersons} personas
              </p>
              <div style={{ border: '1px solid var(--sand)', borderRadius: '4px', overflow: 'hidden' }}>
                <GuestTable list={confirmed} showEstimate />
                {/* Total row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', background: 'var(--olive)', padding: '10px 14px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--cream)' }}>
                    Total
                  </span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 300, color: '#fff', textAlign: 'center' }}>{totalAdults}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 300, color: '#fff', textAlign: 'center' }}>{totalChildren}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: '#fff', textAlign: 'center' }}>{totalPersons}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Pending ── */}
          {pending.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--sand)' }} />
                Sin respuesta · {pending.length} invitaciones · capacidad indicada
              </p>
              <div style={{ border: '1px solid var(--sand)', borderRadius: '4px', overflow: 'hidden' }}>
                <GuestTable list={pending} />
              </div>
            </div>
          )}

          {/* ── Declined ── */}
          {declined.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#e0c4c4' }} />
                No asisten · {declined.length} invitaciones
              </p>
              <div style={{ border: '1px solid var(--sand)', borderRadius: '4px', overflow: 'hidden' }}>
                <GuestTable list={declined} />
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ borderTop: '1px solid var(--sand)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontFamily: 'var(--font-script)', fontSize: '22px', color: 'var(--olive)', opacity: 0.5 }}>
              La Boda Pandaneiros
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.06em' }}>
              Generado el {generatedAt}
            </p>
          </div>

        </div>
      )}
    </>
  )
}
