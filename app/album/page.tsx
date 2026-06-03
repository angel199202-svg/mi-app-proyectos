'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Photo = {
  id: string
  public_url: string
  caption: string | null
  is_featured: boolean
  sort_order: number
}

/* ─── Lightbox ──────────────────────────────────────────── */
function Lightbox({
  photos,
  index,
  onClose,
}: {
  photos: Photo[]
  index: number
  onClose: () => void
}) {
  const [cur, setCur] = useState(index)
  const photo = photos[cur]

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCur((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setCur((i) => Math.min(photos.length - 1, i + 1))
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, photos.length])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(32, 31, 22, 0.93)',
        zIndex: 50, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fade-in 0.2s ease-out both',
      }}
    >
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--cream)', fontSize: '28px', cursor: 'pointer', opacity: 0.7, lineHeight: 1 }}
      >×</button>

      {cur > 0 && (
        <button onClick={(e) => { e.stopPropagation(); setCur((i) => i - 1) }} style={{ position: 'absolute', left: 16, background: 'rgba(250,249,247,0.12)', border: '1px solid rgba(250,249,247,0.2)', color: 'var(--cream)', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 18 }}>‹</button>
      )}

      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.public_url} alt={photo.caption ?? ''} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 3, boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }} />
        {photo.caption && <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--sand)', opacity: 0.85 }}>{photo.caption}</p>}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--sand)', opacity: 0.35, letterSpacing: '0.1em' }}>{cur + 1} / {photos.length}</p>
      </div>

      {cur < photos.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); setCur((i) => i + 1) }} style={{ position: 'absolute', right: 16, background: 'rgba(250,249,247,0.12)', border: '1px solid rgba(250,249,247,0.2)', color: 'var(--cream)', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 18 }}>›</button>
      )}
    </div>
  )
}

/* ─── Slot type ─────────────────────────────────────────── */
type Slot = { photoIdx: number; entering: boolean; leaving: boolean }

const GRID_LAYOUT = [
  { gridColumn: '1', gridRow: '1 / span 2', aspectRatio: '3/4' },
  { gridColumn: '2', gridRow: '1', aspectRatio: '4/3' },
  { gridColumn: '3', gridRow: '1', aspectRatio: '4/3' },
  { gridColumn: '2', gridRow: '2', aspectRatio: '4/3' },
  { gridColumn: '3', gridRow: '2 / span 2', aspectRatio: '3/4' },
  { gridColumn: '1 / span 2', gridRow: '3', aspectRatio: '16/7' },
]

/* ─── Animated photo wall ───────────────────────────────── */
function PhotoWall({ photos, onPhotoClick }: { photos: Photo[]; onPhotoClick: (idx: number) => void }) {
  const VISIBLE = Math.min(photos.length, GRID_LAYOUT.length)

  const [slots, setSlots] = useState<Slot[]>(() =>
    Array.from({ length: VISIBLE }, (_, i) => ({ photoIdx: i % photos.length, entering: false, leaving: false }))
  )

  const rotateSlot = useCallback((slotIndex: number) => {
    const DELAY = 1800 + Math.random() * 3000

    return setTimeout(() => {
      /* mark leaving */
      setSlots((prev) => {
        const next = [...prev]
        next[slotIndex] = { ...next[slotIndex], leaving: true }
        return next
      })

      /* swap after leave anim */
      setTimeout(() => {
        setSlots((prev) => {
          const showing = new Set(prev.map((s) => s.photoIdx))
          const pool = photos.map((_, i) => i).filter((i) => !showing.has(i))
          if (pool.length === 0) return prev.map((s, i) => i === slotIndex ? { ...s, leaving: false } : s)
          const newIdx = pool[Math.floor(Math.random() * pool.length)]
          const next = [...prev]
          next[slotIndex] = { photoIdx: newIdx, entering: true, leaving: false }
          return next
        })

        /* clear entering flag */
        setTimeout(() => {
          setSlots((prev) => {
            const next = [...prev]
            next[slotIndex] = { ...next[slotIndex], entering: false }
            return next
          })
        }, 700)
      }, 500)
    }, DELAY)
  }, [photos])

  useEffect(() => {
    if (photos.length <= VISIBLE) return

    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 0; i < VISIBLE; i++) {
      /* stagger start */
      const startTimer = setTimeout(() => {
        function scheduleNext(slotIdx: number) {
          const t = rotateSlot(slotIdx)
          timers.push(t)
          /* chain: after leave(500) + enter(700) + delay schedule next */
          const chainTimer = setTimeout(() => scheduleNext(slotIdx), 1800 + Math.random() * 3000 + 1200)
          timers.push(chainTimer)
        }
        scheduleNext(i)
      }, i * 600 + Math.random() * 800)

      timers.push(startTimer)
    }

    return () => timers.forEach(clearTimeout)
  }, [photos, VISIBLE, rotateSlot])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'auto auto auto',
        gap: 10,
        maxWidth: 920,
        margin: '0 auto',
      }}
    >
      {slots.map((slot, i) => {
        const photo = photos[slot.photoIdx]
        const layout = GRID_LAYOUT[i]
        return (
          <div
            key={i}
            onClick={() => onPhotoClick(slot.photoIdx)}
            style={{
              gridColumn: layout.gridColumn,
              gridRow: layout.gridRow,
              aspectRatio: layout.aspectRatio,
              borderRadius: 4,
              overflow: 'hidden',
              cursor: 'pointer',
              background: 'var(--sand)',
              opacity: slot.leaving ? 0 : 1,
              transform: slot.leaving
                ? 'scale(0.94) translateY(8px)'
                : slot.entering
                  ? 'scale(1.02)'
                  : 'scale(1)',
              transition: slot.leaving
                ? 'opacity 0.45s ease, transform 0.45s ease'
                : 'opacity 0.65s ease, transform 0.65s ease',
              boxShadow: '0 4px 20px rgba(58,58,40,0.12)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.public_url}
              alt={photo.caption ?? ''}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                transition: 'transform 0.4s ease',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ─── Main page ─────────────────────────────────────────── */
export default function AlbumPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('wedding_photos')
      .select('id, public_url, caption, is_featured, sort_order')
      .order('sort_order', { ascending: true })
      .order('uploaded_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setPhotos(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      <Link href="/" style={{ position: 'fixed', top: 24, left: 24, fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--olive)', opacity: 0.65, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M13 7H1M6 2L1 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
        Inicio
      </Link>

      {/* Header */}
      <section style={{ padding: '100px 24px 48px', textAlign: 'center', background: 'var(--warm)', borderBottom: '1px solid var(--sand)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Nuestros momentos</p>
        <h1 style={{ fontFamily: 'var(--font-script)', fontSize: 'clamp(48px, 10vw, 80px)', color: 'var(--olive)', marginBottom: 8 }}>Nuestro álbum</h1>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--muted)' }}>Momentos que nos llevaron hasta aquí</p>
      </section>

      {/* Gallery */}
      <section style={{ padding: '48px 20px 80px' }}>
        {loading && (
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', padding: '80px 0' }}>Cargando álbum...</p>
        )}

        {error && (
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: '#8B2020', padding: '80px 0' }}>Error: {error}</p>
        )}

        {!loading && !error && photos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--muted)', marginBottom: 12 }}>El álbum está esperando sus fotos</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', opacity: 0.7 }}>Las fotos serán agregadas pronto</p>
          </div>
        )}

        {!loading && !error && photos.length === 1 && (
          <div style={{ maxWidth: 400, margin: '0 auto', cursor: 'pointer' }} onClick={() => setLightbox(0)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[0].public_url} alt={photos[0].caption ?? ''} style={{ width: '100%', borderRadius: 4, display: 'block' }} />
          </div>
        )}

        {!loading && !error && photos.length >= 2 && (
          <PhotoWall photos={photos} onPhotoClick={(idx) => setLightbox(idx)} />
        )}
      </section>

      {lightbox !== null && photos.length > 0 && (
        <Lightbox photos={photos} index={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
