'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Photo = {
  id: string
  public_url: string
  caption: string | null
  is_featured: boolean
  sort_order: number
}

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: Photo[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const photo = photos[index]

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, onPrev, onNext])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(58, 58, 40, 0.92)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fade-in 0.2s ease-out both',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'none',
          border: 'none',
          color: 'var(--cream)',
          fontSize: '28px',
          cursor: 'pointer',
          opacity: 0.7,
          lineHeight: 1,
        }}
      >
        ×
      </button>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          style={{
            position: 'absolute',
            left: '16px',
            background: 'rgba(250,249,247,0.1)',
            border: '1px solid rgba(250,249,247,0.2)',
            color: 'var(--cream)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.public_url}
          alt={photo.caption ?? `Foto ${index + 1}`}
          style={{
            maxWidth: '100%',
            maxHeight: '75vh',
            objectFit: 'contain',
            borderRadius: '3px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          }}
        />
        {photo.caption && (
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '15px', color: 'var(--sand)', opacity: 0.85, textAlign: 'center' }}>
            {photo.caption}
          </p>
        )}
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--sand)', opacity: 0.4, letterSpacing: '0.1em' }}>
          {index + 1} / {photos.length}
        </p>
      </div>

      {/* Next */}
      {index < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          style={{
            position: 'absolute',
            right: '16px',
            background: 'rgba(250,249,247,0.1)',
            border: '1px solid rgba(250,249,247,0.2)',
            color: 'var(--cream)',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
}

/* ─── Upload button (admin) ────────────────────────────── */
function AdminUpload({ onUploaded }: { onUploaded: (p: Photo) => void }) {
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `wedding/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('wedding-photos')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadErr) {
      alert('Error al subir: ' + uploadErr.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('wedding-photos')
      .getPublicUrl(path)

    const { data, error: dbErr } = await supabase
      .from('wedding_photos')
      .insert({ storage_path: path, public_url: urlData.publicUrl, caption: caption.trim() || null })
      .select()
      .single()

    setUploading(false)

    if (dbErr || !data) {
      alert('Error al guardar en DB: ' + (dbErr?.message ?? 'unknown'))
      return
    }

    onUploaded(data)
    setCaption('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      style={{
        padding: '20px',
        background: 'var(--warm)',
        border: '1.5px dashed var(--sand)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        Agregar foto (admin)
      </p>
      <input
        type="text"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Leyenda (opcional)"
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          background: 'var(--cream)',
          border: '1px solid var(--sand)',
          borderRadius: '3px',
          color: 'var(--text)',
          outline: 'none',
        }}
      />
      <label
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--olive)',
          color: 'var(--cream)',
          padding: '10px 20px',
          borderRadius: '2px',
          cursor: uploading ? 'wait' : 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          width: 'fit-content',
          opacity: uploading ? 0.6 : 1,
        }}
      >
        {uploading ? 'Subiendo...' : '+ Subir foto'}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  )
}

/* ─── Main Page ─────────────────────────────────────────── */
export default function AlbumPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsAdmin(true)
    })

    supabase
      .from('wedding_photos')
      .select('id, public_url, caption, is_featured, sort_order')
      .order('sort_order', { ascending: true })
      .order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        setPhotos(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Back */}
      <Link
        href="/"
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--olive)',
          opacity: 0.65,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M13 7H1M6 2L1 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        Inicio
      </Link>

      {/* Header */}
      <section style={{ padding: '100px 24px 60px', textAlign: 'center', background: 'var(--warm)', borderBottom: '1px solid var(--sand)' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
          Nuestros momentos
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-script)',
            fontSize: 'clamp(48px, 10vw, 80px)',
            color: 'var(--olive)',
            marginBottom: '12px',
          }}
        >
          Nuestro álbum
        </h1>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '17px', color: 'var(--muted)' }}>
          Momentos que nos llevaron hasta aquí
        </p>
      </section>

      {/* Admin upload */}
      {isAdmin && (
        <section style={{ padding: '32px 24px', maxWidth: 600, margin: '0 auto' }}>
          <AdminUpload onUploaded={(p) => setPhotos((prev) => [p, ...prev])} />
        </section>
      )}

      {/* Gallery */}
      <section style={{ padding: '40px 24px 80px', maxWidth: 1000, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: '13px' }}>
            Cargando álbum...
          </div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '22px', color: 'var(--muted)', marginBottom: '12px' }}>
              El álbum está esperando sus fotos
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', opacity: 0.7 }}>
              Las fotos serán agregadas pronto
            </p>
          </div>
        ) : (
          /* Masonry-ish grid using columns */
          <div
            style={{
              columns: 'auto 280px',
              columnGap: '12px',
            }}
          >
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(i)}
                style={{
                  breakInside: 'avoid',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: 'var(--sand)',
                  animation: `fade-up 0.5s ${i * 0.06}s ease-out both`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.public_url}
                  alt={photo.caption ?? `Foto ${i + 1}`}
                  style={{
                    width: '100%',
                    display: 'block',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
                {photo.is_featured && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: 'var(--rose)',
                      borderRadius: '2px',
                      padding: '3px 8px',
                      fontFamily: 'var(--font-body)',
                      fontSize: '9px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--olive)',
                    }}
                  >
                    Destacada
                  </div>
                )}
                {photo.caption && (
                  <div
                    style={{
                      padding: '10px 14px',
                      background: 'var(--warm)',
                      borderTop: '1px solid var(--sand)',
                    }}
                  >
                    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '14px', color: 'var(--text)', opacity: 0.8 }}>
                      {photo.caption}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, (i ?? 1) - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(photos.length - 1, (i ?? 0) + 1))}
        />
      )}
    </div>
  )
}
