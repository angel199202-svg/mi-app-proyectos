'use client'

import { useState, useEffect } from 'react'

const WEDDING = new Date('2026-07-17T16:00:00-04:00')

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        minWidth: 76,
        padding: '18px 14px',
        background: 'var(--warm)',
        border: '1px solid var(--sand)',
        borderRadius: 4,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Accent top line — expands on mount */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, var(--sand), var(--rose), var(--sand))',
          opacity: 0.8,
        }}
      />

      {/* Number — key forces remount on change = triggers animation */}
      <p
        key={value}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(34px, 6vw, 46px)',
          fontWeight: 300,
          color: 'var(--olive)',
          lineHeight: 1,
          margin: '0 0 6px',
          letterSpacing: '-0.02em',
          animation: 'tick-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        }}
      >
        {pad(value)}
      </p>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 9,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          margin: 0,
        }}
      >
        {label}
      </p>
    </div>
  )
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

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Unit value={t.d} label="días" />
      <Unit value={t.h} label="horas" />
      <Unit value={t.m} label="min" />
      <Unit value={t.s} label="seg" />
    </div>
  )
}
