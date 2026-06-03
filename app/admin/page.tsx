'use client'

import { PeopleIcon, CameraIcon, GlobeIcon } from '../components/Icons'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Stats = {
  total: number
  confirmed: number
  declined: number
  pending: number
  plusOnes: number
  photos: number
}

function StatCard({ label, value, sub, color = 'var(--olive)' }: {
  label: string; value: number | string; sub?: string; color?: string
}) {
  return (
    <div className="info-card" style={{ textAlign: 'left' }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '42px', fontWeight: 300, color, lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: guests }, { count: photoCount }] = await Promise.all([
        supabase.from('wedding_guests').select('rsvp_attending, rsvp_plus_one'),
        supabase.from('wedding_photos').select('id', { count: 'exact', head: true }),
      ])

      const g = guests ?? []
      setStats({
        total:     g.length,
        confirmed: g.filter((x) => x.rsvp_attending === true).length,
        declined:  g.filter((x) => x.rsvp_attending === false).length,
        pending:   g.filter((x) => x.rsvp_attending === null).length,
        plusOnes:  g.filter((x) => x.rsvp_plus_one === true).length,
        photos:    photoCount ?? 0,
      })
    }
    load()
  }, [])

  const totalAttending = (stats?.confirmed ?? 0) + (stats?.plusOnes ?? 0)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '32px', fontWeight: 300, color: 'var(--olive)' }}>
          Resumen
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
          Boda Pandaneiros · Viernes 17 de Julio, 2026
        </p>
      </div>

      {!stats ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>Cargando...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <StatCard label="Total invitados" value={stats.total} />
            <StatCard label="Confirmados" value={stats.confirmed} color="#4a6741" sub={`+ ${stats.plusOnes} acompañantes`} />
            <StatCard label="Asistirán" value={totalAttending} sub="personas en total" color="var(--olive)" />
            <StatCard label="No asisten" value={stats.declined} color="var(--muted)" />
            <StatCard label="Sin respuesta" value={stats.pending} color="var(--rose)" />
            <StatCard label="Fotos en álbum" value={stats.photos} />
          </div>

          {/* Progress bar */}
          {stats.total > 0 && (
            <div style={{ marginBottom: '40px', background: 'var(--warm)', border: '1px solid var(--sand)', borderRadius: '4px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Respuestas recibidas
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--olive)', fontWeight: 700 }}>
                  {stats.total - stats.pending} / {stats.total}
                </span>
              </div>
              <div style={{ height: '6px', background: 'var(--sand)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(((stats.total - stats.pending) / stats.total) * 100)}%`,
                  background: 'var(--olive)',
                  borderRadius: '3px',
                  transition: 'width 0.6s ease-out',
                }} />
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {[
          { href: '/admin/invitados', title: 'Gestionar invitados', desc: 'Agregar, editar o eliminar invitados y sus códigos', icon: <PeopleIcon size={24} color='var(--olive)' strokeWidth={1.3} /> },
          { href: '/admin/fotos',     title: 'Gestionar fotos',     desc: 'Subir fotos al álbum y administrar la galería',  icon: <CameraIcon size={24} color='var(--olive)' strokeWidth={1.3} /> },
          { href: '/',                title: 'Ver el sitio',         desc: 'Abre la página de invitación como la ven los invitados', icon: <GlobeIcon size={24} color='var(--olive)' strokeWidth={1.3} /> },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            target={card.href === '/' ? '_blank' : undefined}
            style={{
              display: 'block',
              background: 'var(--warm)',
              border: '1px solid var(--sand)',
              borderRadius: '4px',
              padding: '24px',
              textDecoration: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--olive)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(106,107,75,0.1)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--sand)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ marginBottom: '10px', display: 'flex' }}>{card.icon}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', color: 'var(--olive)', marginBottom: '6px' }}>
              {card.title}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.5 }}>
              {card.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
