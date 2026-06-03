'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Photo = {
  id: string
  public_url: string
  caption: string | null
  is_featured: boolean
  sort_order: number
}

/* ─── Carousel ──────────────────────────────────────────── */
function Carousel({ photos }: { photos: Photo[] }) {
  const [current, setCurrent] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function goTo(idx: number) {
    if (transitioning || idx === current) return
    setTransitioning(true)
    setTimeout(() => {
      setCurrent((idx + photos.length) % photos.length)
      setTransitioning(false)
    }, 380)
  }

  function next() { goTo(current + 1) }
  function prev() { goTo(current - 1) }

  /* auto-advance */
  useEffect(() => {
    if (paused || photos.length <= 1) return
    timerRef.current = setTimeout(next, 6000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  })

  /* keyboard */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const photo = photos[current]

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ width: '100%', maxWidth: 860, margin: '0 auto', userSelect: 'none' }}
    >
      {/* Photo frame */}
      <div
        style={{
          position: 'relative',
          background: 'var(--warm)',
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(58,58,40,0.14)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current}
          src={photo.public_url}
          alt={photo.caption ?? ''}
          style={{
            width: '100%',
            maxHeight: '72vh',
            minHeight: 260,
            objectFit: 'contain',
            display: 'block',
            background: 'var(--cream)',
            opacity: transitioning ? 0 : 1,
            transform: transitioning ? 'scale(0.985)' : 'scale(1)',
            transition: 'opacity 0.38s ease, transform 0.38s ease',
          }}
        />

        {/* Prev */}
        {photos.length > 1 && (
          <button
            onClick={prev}
            aria-label="Anterior"
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(250,249,247,0.85)', border: '1px solid rgba(196,191,172,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--olive)',
              transition: 'background 0.2s, transform 0.15s',
              backdropFilter: 'blur(4px)',
            }}
            onMouseOver={(e) => { (e.currentTarget.style.background = 'rgba(250,249,247,1)'); (e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)') }}
            onMouseOut={(e) => { (e.currentTarget.style.background = 'rgba(250,249,247,0.85)'); (e.currentTarget.style.transform = 'translateY(-50%) scale(1)') }}
          >
            <ChevronLeft size={18} strokeWidth={1.8} />
          </button>
        )}

        {/* Next */}
        {photos.length > 1 && (
          <button
            onClick={next}
            aria-label="Siguiente"
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(250,249,247,0.85)', border: '1px solid rgba(196,191,172,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--olive)',
              transition: 'background 0.2s, transform 0.15s',
              backdropFilter: 'blur(4px)',
            }}
            onMouseOver={(e) => { (e.currentTarget.style.background = 'rgba(250,249,247,1)'); (e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)') }}
            onMouseOut={(e) => { (e.currentTarget.style.background = 'rgba(250,249,247,0.85)'); (e.currentTarget.style.transform = 'translateY(-50%) scale(1)') }}
          >
            <ChevronRight size={18} strokeWidth={1.8} />
          </button>
        )}

        {/* Counter */}
        {photos.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 12, right: 16,
            fontFamily: 'var(--font-body)', fontSize: 11,
            letterSpacing: '0.1em', color: 'var(--warm)',
            background: 'rgba(58,58,40,0.45)', backdropFilter: 'blur(4px)',
            padding: '4px 10px', borderRadius: 20,
          }}>
            {current + 1} / {photos.length}
          </div>
        )}
      </div>

      {/* Caption */}
      <div style={{ minHeight: 32, padding: '14px 0 8px', textAlign: 'center' }}>
        {photo.caption && (
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--text)', opacity: 0.75 }}>
            {photo.caption}
          </p>
        )}
      </div>

      {/* Dots */}
      {photos.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 4 }}>
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Foto ${i + 1}`}
              style={{
                width: i === current ? 22 : 7,
                height: 7,
                borderRadius: 4,
                background: i === current ? 'var(--olive)' : 'var(--sand)',
                border: 'none', padding: 0, cursor: 'pointer',
                transition: 'width 0.3s ease, background 0.2s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function AlbumPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

      <Link
        href="/"
        style={{
          position: 'fixed', top: 24, left: 24, zIndex: 10,
          fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--olive)', opacity: 0.65,
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <ChevronLeft size={14} strokeWidth={1.8} />
        Inicio
      </Link>

      {/* Header */}
      <section style={{ padding: '100px 24px 48px', textAlign: 'center', background: 'var(--warm)', borderBottom: '1px solid var(--sand)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
          Nuestros momentos
        </p>
        <h1 style={{ fontFamily: 'var(--font-script)', fontSize: 'clamp(48px, 10vw, 80px)', color: 'var(--olive)', marginBottom: 8 }}>
          Nuestro álbum
        </h1>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 17, color: 'var(--muted)' }}>
          Momentos que nos llevaron hasta aquí
        </p>
      </section>

      {/* Carousel */}
      <section style={{ padding: '48px 20px 80px' }}>
        {loading && (
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', padding: '80px 0' }}>
            Cargando álbum...
          </p>
        )}
        {error && (
          <p style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: '#8B2020', padding: '40px 0' }}>
            Error al cargar fotos: {error}
          </p>
        )}
        {!loading && !error && photos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 22, color: 'var(--muted)', marginBottom: 8 }}>
              El álbum está esperando sus fotos
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)', opacity: 0.7 }}>
              Pronto habrá fotos aquí
            </p>
          </div>
        )}
        {!loading && !error && photos.length > 0 && (
          <Carousel photos={photos} />
        )}
      </section>
    </div>
  )
}
