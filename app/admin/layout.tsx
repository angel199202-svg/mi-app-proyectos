'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { DashboardIcon, PeopleIcon, PhotosIcon } from '../components/Icons'
import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/admin',           label: 'Resumen',    icon: <DashboardIcon size={15} color='currentColor' strokeWidth={1.5} /> },
  { href: '/admin/invitados', label: 'Invitados',  icon: <PeopleIcon size={15} color='currentColor' strokeWidth={1.5} /> },
  { href: '/admin/fotos',     label: 'Fotos',      icon: <PhotosIcon size={15} color='currentColor' strokeWidth={1.5} /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin/login')
      else setChecking(false)
    })
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  if (pathname === '/admin/login') return <>{children}</>

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', letterSpacing: '0.1em' }}>
          Verificando sesión…
        </p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>

      {/* Top nav */}
      <header
        style={{
          background: 'var(--olive)',
          borderBottom: '1px solid rgba(250,249,247,0.1)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '56px',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <span style={{ fontFamily: 'var(--font-script)', fontSize: '26px', color: 'var(--cream)', lineHeight: 1 }}>
            A &amp; M
          </span>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {NAV.map((item) => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: active ? 'var(--cream)' : 'rgba(229,227,230,0.55)',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: '3px',
                    background: active ? 'rgba(250,249,247,0.12)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(229,227,230,0.5)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px 0',
          }}
        >
          Salir
        </button>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {children}
      </main>
    </div>
  )
}
