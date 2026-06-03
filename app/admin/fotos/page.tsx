'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { StarIcon, LinkIcon, TrashIcon } from '../../components/Icons'

type Photo = {
  id: string
  storage_path: string
  public_url: string
  caption: string | null
  is_featured: boolean
  sort_order: number
  uploaded_at: string
}

export default function FotosAdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [featured, setFeatured] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [editingCaption, setEditingCaption] = useState<{ id: string; value: string } | null>(null)

  async function load() {
    const { data } = await supabase
      .from('wedding_photos')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('uploaded_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `wedding/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('wedding-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (upErr) { alert('Error subiendo ' + file.name + ': ' + upErr.message); continue }

      const { data: urlData } = supabase.storage.from('wedding-photos').getPublicUrl(path)

      await supabase.from('wedding_photos').insert({
        storage_path: path,
        public_url:   urlData.publicUrl,
        caption:      caption.trim() || null,
        is_featured:  featured,
        sort_order:   photos.length,
      })
    }

    setCaption('')
    setFeatured(false)
    if (inputRef.current) inputRef.current.value = ''
    setUploading(false)
    load()
  }

  async function handleDelete(photo: Photo) {
    if (!confirm(`¿Eliminar esta foto? No se puede deshacer.`)) return
    await supabase.storage.from('wedding-photos').remove([photo.storage_path])
    await supabase.from('wedding_photos').delete().eq('id', photo.id)
    load()
  }

  async function toggleFeatured(photo: Photo) {
    await supabase.from('wedding_photos').update({ is_featured: !photo.is_featured }).eq('id', photo.id)
    load()
  }

  async function saveCaption(id: string, value: string) {
    await supabase.from('wedding_photos').update({ caption: value.trim() || null }).eq('id', id)
    setEditingCaption(null)
    load()
  }

  async function updateOrder(id: string, newOrder: number) {
    await supabase.from('wedding_photos').update({ sort_order: newOrder }).eq('id', id)
    load()
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontFamily: 'var(--font-body)', fontSize: '14px',
    background: 'var(--cream)', border: '1.5px solid var(--sand)',
    borderRadius: '3px', color: 'var(--text)', outline: 'none',
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '32px', fontWeight: 300, color: 'var(--olive)' }}>
          Álbum de fotos
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
          {photos.length} fotos · {photos.filter((p) => p.is_featured).length} destacadas
        </p>
      </div>

      {/* Upload zone */}
      <div
        style={{
          background: 'var(--warm)', border: '2px dashed var(--sand)', borderRadius: '4px',
          padding: '28px', marginBottom: '32px',
        }}
      >
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
          Subir fotos
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: '2 1 200px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
              Leyenda (se aplica a todas las fotos de esta carga)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Leyenda opcional..."
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 14px', background: 'var(--cream)', border: '1.5px solid var(--sand)', borderRadius: '3px', flex: '0 0 auto' }}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              style={{ width: '14px', height: '14px', accentColor: 'var(--olive)' }}
            />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text)', whiteSpace: 'nowrap' }}>Destacar</span>
          </label>

          <label
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: uploading ? 'var(--sand)' : 'var(--olive)',
              color: 'var(--cream)',
              padding: '10px 20px', borderRadius: '3px',
              cursor: uploading ? 'wait' : 'pointer',
              fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              flex: '0 0 auto',
              transition: 'background 0.2s',
            }}
          >
            {uploading ? 'Subiendo...' : '+ Elegir fotos'}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {uploading && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--muted)', marginTop: '12px' }}>
            Subiendo fotos… no cierres la página
          </p>
        )}
      </div>

      {/* Photo grid */}
      {loading ? (
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)' }}>Cargando...</p>
      ) : photos.length === 0 ? (
        <div style={{ background: 'var(--warm)', border: '1px solid var(--sand)', borderRadius: '4px', padding: '48px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '20px', color: 'var(--muted)' }}>
            No hay fotos aún. Sube la primera.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                background: 'var(--warm)', border: '1px solid var(--sand)', borderRadius: '4px',
                overflow: 'hidden',
                outline: photo.is_featured ? '2px solid var(--rose)' : 'none',
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--sand)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.public_url}
                  alt={photo.caption ?? ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {photo.is_featured && (
                  <div style={{
                    position: 'absolute', top: '8px', left: '8px',
                    background: 'var(--rose)', borderRadius: '2px',
                    padding: '3px 8px', fontFamily: 'var(--font-body)',
                    fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'var(--olive)',
                  }}>
                    Destacada
                  </div>
                )}
              </div>

              {/* Caption */}
              <div style={{ padding: '12px 14px 0' }}>
                {editingCaption?.id === photo.id ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={editingCaption.value}
                      onChange={(e) => setEditingCaption({ id: photo.id, value: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveCaption(photo.id, editingCaption.value)
                        if (e.key === 'Escape') setEditingCaption(null)
                      }}
                      style={{ ...inputStyle, flex: 1, fontSize: '13px', padding: '6px 10px' }}
                      autoFocus
                    />
                    <button onClick={() => saveCaption(photo.id, editingCaption.value)} style={{ padding: '6px 10px', background: 'var(--olive)', color: 'var(--cream)', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>✓</button>
                    <button onClick={() => setEditingCaption(null)} style={{ padding: '6px 10px', background: 'none', border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingCaption({ id: photo.id, value: photo.caption ?? '' })}
                    style={{
                      width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '14px',
                      color: photo.caption ? 'var(--text)' : 'var(--muted)',
                      padding: '4px 0',
                    }}
                  >
                    {photo.caption ?? 'Agregar leyenda...'}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div style={{ padding: '10px 14px 14px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.08em' }}>Orden:</span>
                  <input
                    type="number"
                    defaultValue={photo.sort_order}
                    onBlur={(e) => updateOrder(photo.id, Number(e.target.value))}
                    style={{ ...inputStyle, width: '52px', padding: '4px 8px', fontSize: '12px' }}
                  />
                </div>

                <button
                  onClick={() => toggleFeatured(photo)}
                  title={photo.is_featured ? 'Quitar destacada' : 'Destacar'}
                  style={{
                    padding: '6px 10px', background: photo.is_featured ? 'var(--rose)' : 'none',
                    border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer', fontSize: '13px',
                  }}
                >
                  <StarIcon size={14} color={photo.is_featured ? 'var(--olive)' : 'var(--muted)'} strokeWidth={1.5} />
                </button>

                <a
                  href={photo.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: '6px 10px', background: 'none', border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer', fontSize: '13px', textDecoration: 'none', display: 'inline-flex' }}
                  title="Ver original"
                >
                  <LinkIcon size={14} color='var(--olive)' strokeWidth={1.5} />
                </a>

                <button
                  onClick={() => handleDelete(photo)}
                  title="Eliminar"
                  style={{ padding: '6px 10px', background: 'none', border: '1px solid var(--sand)', borderRadius: '3px', cursor: 'pointer', fontSize: '13px' }}
                >
                  <TrashIcon size={14} color='var(--olive)' strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
