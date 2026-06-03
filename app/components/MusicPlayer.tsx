'use client'

import { useState } from 'react'
import { Music, ChevronUp, ChevronDown, X } from 'lucide-react'

const TRACK_ID = '04j67XNNVu1HI7JrIlMM3S'

export function MusicPlayer() {
  const [open, setOpen] = useState(false)
  const [gone, setGone] = useState(false)

  if (gone) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'var(--olive)',
        borderTop: '1px solid rgba(250,249,247,0.12)',
        boxShadow: '0 -4px 24px rgba(58,58,40,0.18)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Collapsed pill */}
      {!open && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 18px',
            cursor: 'pointer',
          }}
          onClick={() => setOpen(true)}
        >
          <div
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(209,190,176,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              animation: 'pulse-soft 2s ease-in-out infinite',
            }}
          >
            <Music size={15} color="var(--rose)" />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 700,
              color: 'var(--cream)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              Accidentally in Love
            </p>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 10,
              color: 'var(--sand)', opacity: 0.7, margin: 0,
              letterSpacing: '0.06em',
            }}>
              Counting Crows · Nuestra canción
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--sand)', opacity: 0.6, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Escuchar
            </span>
            <ChevronUp size={16} color="var(--cream)" strokeWidth={1.8} />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setGone(true) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--sand)', opacity: 0.5, padding: '4px',
              display: 'flex', alignItems: 'center',
              transition: 'opacity 0.15s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '0.5')}
            aria-label="Cerrar"
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
      )}

      {/* Expanded player */}
      {open && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 16px 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Music size={13} color="var(--rose)" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--sand)', opacity: 0.65, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Nuestra canción
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sand)', opacity: 0.6, display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <ChevronDown size={16} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setGone(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sand)', opacity: 0.5, display: 'flex', alignItems: 'center', padding: '4px' }}
              >
                <X size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <iframe
            src={`https://open.spotify.com/embed/track/${TRACK_ID}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ display: 'block' }}
            title="Accidentally in Love — Counting Crows"
          />
        </div>
      )}
    </div>
  )
}
