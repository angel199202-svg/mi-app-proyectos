'use client'

import { createClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Proyecto = {
  id: number
  name: string
  description: string | null
  status: string
}

const STATUSES = [
  { label: 'Pendiente',    style: 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',     dot: 'bg-amber-400' },
  { label: 'En progreso',  style: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',        dot: 'bg-blue-400' },
  { label: 'En revisión',  style: 'bg-violet-50 text-violet-600 ring-1 ring-violet-200',  dot: 'bg-violet-400' },
  { label: 'Completado',   style: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200', dot: 'bg-emerald-400' },
  { label: 'Cancelado',    style: 'bg-rose-50 text-rose-500 ring-1 ring-rose-200',        dot: 'bg-rose-400' },
]

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.label, s]))

const CONFETTI_COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#f97316']

const PARTICLES = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * Math.PI * 2
  const dist = 45 + (i % 5) * 14
  return {
    tx: Math.cos(angle) * dist,
    ty: Math.sin(angle) * dist,
    rot: 60 + i * 18,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    w: 5 + (i % 4) * 2,
    h: i % 4 === 3 ? 3 : 5 + (i % 4) * 2,
    r: i % 3 === 0 ? '50%' : '2px',
    delay: (i % 5) * 25,
  }
})

function StatusDropdown({
  proyectoId,
  current,
  onChange,
}: {
  proyectoId: number
  current: string
  onChange: (id: number, status: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function select(label: string) {
    if (label === current) { setOpen(false); return }
    setSaving(true)
    setOpen(false)
    await onChange(proyectoId, label)
    setSaving(false)
  }

  const info = STATUS_MAP[current] ?? STATUSES[0]

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full transition-all cursor-pointer hover:opacity-80 active:scale-95 disabled:opacity-50 ${info.style}`}
        title="Cambiar estado"
      >
        {saving ? (
          <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
          </svg>
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${info.dot}`} />
        )}
        {current}
        <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[140px] status-dropdown">
          {STATUSES.map(s => (
            <button
              key={s.label}
              onClick={() => select(s.label)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 text-left transition-colors hover:bg-gray-50 ${s.label === current ? 'opacity-40 cursor-default' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
              {s.label}
              {s.label === current && (
                <svg className="w-3 h-3 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [exitingId, setExitingId] = useState<number | null>(null)
  const [newProjectId, setNewProjectId] = useState<number | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiKey, setConfettiKey] = useState(0)

  const cargarProyectos = useCallback(async () => {
    const { data } = await supabase
      .from('proyectos')
      .select('*')
      .order('id', { ascending: false })
    if (data) setProyectos(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    cargarProyectos()
  }, [cargarProyectos])

  async function crearProyecto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    const form = e.currentTarget
    const formData = new FormData(form)

    const { data: inserted, error } = await supabase
      .from('proyectos')
      .insert([{
        name: formData.get('name'),
        description: formData.get('description'),
        status: 'Pendiente',
      }])
      .select()

    if (!error && inserted?.[0]) {
      const newId = inserted[0].id
      form.reset()
      await cargarProyectos()
      setNewProjectId(newId)
      setShowConfetti(true)
      setConfettiKey(k => k + 1)
      setTimeout(() => {
        setNewProjectId(null)
        setShowConfetti(false)
      }, 900)
    } else if (error) {
      alert('Error al guardar: ' + error.message)
    }
    setSubmitting(false)
  }

  async function borrarProyecto(id: number) {
    setDeleting(id)
    const { data: deleted, error } = await supabase
      .from('proyectos')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      alert('Error al borrar: ' + error.message)
      setDeleting(null)
      return
    }

    if (!deleted || deleted.length === 0) {
      alert('No se borró (RLS bloqueó la operación). Verifica las políticas de la tabla en Supabase.')
      setDeleting(null)
      return
    }
    setExitingId(id)
    setTimeout(() => {
      setProyectos(prev => prev.filter(p => p.id !== id))
      setExitingId(null)
      setDeleting(null)
    }, 500)
  }

  async function cambiarStatus(id: number, status: string) {
    const { data: updated, error } = await supabase
      .from('proyectos')
      .update({ status })
      .eq('id', id)
      .select()

    if (error) {
      alert('Error al actualizar: ' + error.message)
      return
    }
    if (!updated || updated.length === 0) {
      alert('No se guardó (RLS bloqueó UPDATE). Agrega política UPDATE en Supabase.')
      return
    }
    setProyectos(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 px-6 pt-14 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-white/60 text-sm font-medium tracking-wide">Panel de control</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Mis Proyectos</h1>
          <p className="text-indigo-300 text-sm">
            {loading ? '...' : proyectos.length === 0
              ? 'Sin proyectos aún'
              : `${proyectos.length} proyecto${proyectos.length !== 1 ? 's' : ''} en total`
            }
          </p>
        </div>
      </header>

      {/* CONTENIDO */}
      <div className="max-w-3xl mx-auto px-6 -mt-14 pb-16 space-y-6">

        {/* FORMULARIO */}
        <div className="bg-white rounded-2xl shadow-xl shadow-indigo-900/10 border border-white/80 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="font-semibold text-gray-800">Nuevo proyecto</h2>
          </div>
          <form onSubmit={crearProyecto} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Nombre
              </label>
              <input
                name="name"
                placeholder="ej. Rediseño de landing page"
                className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Descripción <span className="text-gray-300 normal-case font-normal">(opcional)</span>
              </label>
              <textarea
                name="description"
                placeholder="Describe brevemente el objetivo del proyecto..."
                rows={3}
                className="w-full px-4 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Botón + confetti burst */}
            <div className="relative">
              {showConfetti && (
                <div
                  key={confettiKey}
                  className="absolute inset-0 pointer-events-none"
                  style={{ overflow: 'visible', zIndex: 50 }}
                >
                  {PARTICLES.map((p, i) => (
                    <div
                      key={i}
                      className="confetti-particle"
                      style={{
                        '--tx': `${p.tx}px`,
                        '--ty': `${p.ty}px`,
                        '--rot': `${p.rot}deg`,
                        backgroundColor: p.color,
                        width: `${p.w}px`,
                        height: `${p.h}px`,
                        borderRadius: p.r,
                        animationDelay: `${p.delay}ms`,
                      } as React.CSSProperties}
                    />
                  ))}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 active:scale-[.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Guardando...
                  </>
                ) : 'Crear proyecto'}
              </button>
            </div>
          </form>
        </div>

        {/* LISTA */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Proyectos activos
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 w-40 bg-gray-100 rounded" />
                      <div className="h-3 w-56 bg-gray-100 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-gray-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : proyectos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">Aún no tienes proyectos</p>
              <p className="text-xs text-gray-300">Crea el primero usando el formulario de arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proyectos.map((proy, index) => (
                <div
                  key={proy.id}
                  className={[
                    'bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 p-5 flex items-center gap-4 group',
                    exitingId === proy.id ? 'card-exit' : '',
                    newProjectId === proy.id ? 'card-enter' : '',
                  ].join(' ')}
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-indigo-100 transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{proy.name}</h3>
                    {proy.description && (
                      <p className="text-gray-400 text-xs mt-0.5 truncate">{proy.description}</p>
                    )}
                  </div>
                  <StatusDropdown
                    proyectoId={proy.id}
                    current={proy.status}
                    onChange={cambiarStatus}
                  />
                  <button
                    onClick={() => borrarProyecto(proy.id)}
                    disabled={deleting === proy.id}
                    className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Borrar proyecto"
                  >
                    {deleting === proy.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
