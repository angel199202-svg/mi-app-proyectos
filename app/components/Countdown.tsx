'use client'

import { useState, useEffect } from 'react'

// Venezuela UTC-4
const WEDDING = new Date('2026-07-17T16:00:00-04:00')

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function Countdown() {
  const [t, setT] = useState<{ d: number; h: number; m: number; s: number } | null>(null)

  useEffect(() => {
    function calc() {
      const ms = WEDDING.getTime() - Date.now()
      if (ms <= 0) { setT({ d: 0, h: 0, m: 0, s: 0 }); return }
      const s = Math.floor(ms / 1000)
      setT({ d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [])

  if (!t) return null

  const units = [
    { value: t.d, label: 'días' },
    { value: t.h, label: 'horas' },
    { value: t.m, label: 'min' },
    { value: t.s, label: 'seg' },
  ]

  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {units.map(({ value, label }) => (
        <div
          key={label}
          style={{
            minWidth: 76,
            padding: '16px 12px',
            background: 'var(--warm)',
            border: '1px solid var(--sand)',
            borderRadius: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'var(--rose)', opacity: 0.65,
            }}
          />
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 6vw, 44px)',
              fontWeight: 300,
              color: 'var(--olive)',
              lineHeight: 1,
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            {pad(value)}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              margin: 0,
            }}
          >
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}
