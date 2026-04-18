'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

type Reserva = {
  id: string
  user_id: string
  nombre: string
  fecha: string
  hora_inicio: string
  duracion_horas: number
  notas: string | null
  created_at: string
}

const DURACIONES = [
  { value: 0.5,  label: '30 min' },
  { value: 1,    label: '1 hora' },
  { value: 1.5,  label: '1h 30min' },
  { value: 2,    label: '2 horas' },
  { value: 3,    label: '3 horas' },
  { value: 4,    label: '4 horas' },
  { value: 6,    label: '6 horas' },
  { value: 8,    label: '8 horas' },
  { value: 12,   label: 'Día completo (12h)' },
]

function formatTime(time: string) {
  return time.slice(0, 5)
}

function addHoursToTime(time: string, hours: number) {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + Math.round(hours * 60)
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatFecha(fecha: string) {
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function duracionLabel(value: number) {
  return DURACIONES.find(d => d.value === value)?.label ?? `${value}h`
}

function hasConflict(
  fecha: string,
  hora_inicio: string,
  duracion_horas: number,
  existing: Reserva[],
  excludeId?: string,
) {
  const newStart = timeToMinutes(hora_inicio)
  const newEnd = newStart + Math.round(duracion_horas * 60)
  return existing
    .filter(r => r.fecha === fecha && r.id !== excludeId)
    .some(r => {
      const start = timeToMinutes(r.hora_inicio)
      const end = start + Math.round(r.duracion_horas * 60)
      return newStart < end && start < newEnd
    })
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  )
}

function ReservaCard({
  reserva,
  esMia,
  onDelete,
  onEdit,
  deleting,
  pasada = false,
}: {
  reserva: Reserva
  esMia: boolean
  onDelete: (id: string) => void
  onEdit: (r: Reserva) => void
  deleting: boolean
  pasada?: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inicio = formatTime(reserva.hora_inicio)
  const fin = addHoursToTime(reserva.hora_inicio, reserva.duracion_horas)
  const accent = esMia ? 'indigo' : 'violet'

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all hover:shadow-md ${esMia ? 'border-indigo-100' : 'border-violet-100'}`}>
      <div className="flex gap-3 p-4">
        <div className={`w-1 rounded-full shrink-0 ${esMia ? 'bg-indigo-500' : 'bg-violet-500'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-400 capitalize truncate">{formatFecha(reserva.fecha)}</p>
              <p className="text-lg font-bold text-gray-800 mt-0.5 tracking-tight">
                {inicio} <span className="text-gray-400 font-normal text-sm">→</span> {fin}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${esMia ? 'bg-indigo-50 text-indigo-500' : 'bg-violet-50 text-violet-500'}`}>
                  {capitalize(reserva.nombre)}
                </span>
                <span className="text-xs text-gray-400">{duracionLabel(reserva.duracion_horas)}</span>
              </div>
            </div>

            {esMia && !pasada && (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => onEdit(reserva)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-indigo-400 hover:bg-indigo-50 transition-all"
                  aria-label="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                {confirmDelete ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => { onDelete(reserva.id); setConfirmDelete(false) }}
                      disabled={deleting}
                      className="h-9 px-3 flex items-center justify-center rounded-xl text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50"
                    >
                      {deleting ? <Spinner /> : 'Sí'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="h-9 px-3 flex items-center justify-center rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={deleting}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all disabled:opacity-50"
                    aria-label="Eliminar"
                  >
                    {deleting ? <Spinner /> : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {reserva.notas && (
            <p className="text-xs text-gray-500 mt-2 bg-gray-50 px-3 py-1.5 rounded-lg">{reserva.notas}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editando, setEditando] = useState<Reserva | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const [fecha, setFecha] = useState(today)
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [duracion, setDuracion] = useState(1)
  const [notas, setNotas] = useState('')

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from('reservas')
      .select('*')
      .order('fecha', { ascending: true })
      .order('hora_inicio', { ascending: true })
    if (data) setReservas(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/'); return }
      setUser(data.user)
      cargar()
    })
  }, [router, cargar])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  function resetForm() {
    setFecha(today)
    setHoraInicio('09:00')
    setDuracion(1)
    setNotas('')
    setFormError('')
    setEditando(null)
  }

  function abrirEditar(r: Reserva) {
    setEditando(r)
    setFecha(r.fecha)
    setHoraInicio(r.hora_inicio.slice(0, 5))
    setDuracion(r.duracion_horas)
    setNotas(r.notas ?? '')
    setFormError('')
    setShowModal(true)
  }

  function cerrarModal() {
    setShowModal(false)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (hasConflict(fecha, horaInicio, duracion, reservas, editando?.id)) {
      setFormError('Conflicto: ya existe una reserva en ese horario.')
      return
    }

    setSubmitting(true)
    const nombre = user?.email?.split('@')[0] ?? 'usuario'

    if (editando) {
      const { error } = await supabase.from('reservas').update({
        fecha,
        hora_inicio: horaInicio,
        duracion_horas: duracion,
        notas: notas.trim() || null,
      }).eq('id', editando.id)

      if (error) {
        setFormError('Error al guardar: ' + error.message)
        setSubmitting(false)
        return
      }
    } else {
      const { error } = await supabase.from('reservas').insert([{
        user_id: user?.id,
        nombre,
        fecha,
        hora_inicio: horaInicio,
        duracion_horas: duracion,
        notas: notas.trim() || null,
      }])

      if (error) {
        setFormError('Error al guardar: ' + error.message)
        setSubmitting(false)
        return
      }
    }

    cerrarModal()
    await cargar()
    setSubmitting(false)
  }

  async function borrar(id: string) {
    setDeleting(id)
    await supabase.from('reservas').delete().eq('id', id)
    setReservas(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const proximas = reservas.filter(r => r.fecha >= today)
  const pasadas = reservas.filter(r => r.fecha < today).slice(-5).reverse()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spinner className="w-8 h-8 text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <header className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-5 pt-safe pb-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 17h8M5 9l1.5-4.5A1 1 0 017.447 4h9.106a1 1 0 01.947.672L19 9m-14 0h14m-14 0l-1 4h16l-1-4M6 17a2 2 0 01-2-2v-4h16v4a2 2 0 01-2 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold leading-none">Pandaneiros</h1>
                <p className="text-slate-400 text-xs">Peugeot 208</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs hidden sm:block">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-2 rounded-xl transition-all min-h-[40px] flex items-center"
              >
                Salir
              </button>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white">Reservas</h2>
          <p className="text-slate-400 text-sm mt-1">
            {proximas.length === 0
              ? 'Sin reservas próximas'
              : `${proximas.length} reserva${proximas.length !== 1 ? 's' : ''} próxima${proximas.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </header>

      {/* CONTENIDO */}
      <div className="max-w-2xl mx-auto px-5 -mt-10 pb-safe space-y-4">
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm py-3.5 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all active:scale-[.99] flex items-center justify-center gap-2 min-h-[52px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva reserva
        </button>

        {proximas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">Sin reservas próximas</p>
            <p className="text-xs text-gray-300">Crea una usando el botón de arriba</p>
          </div>
        ) : (
          <div className="space-y-3">
            {proximas.map(r => (
              <ReservaCard
                key={r.id}
                reserva={r}
                esMia={r.user_id === user?.id}
                onDelete={borrar}
                onEdit={abrirEditar}
                deleting={deleting === r.id}
              />
            ))}
          </div>
        )}

        {pasadas.length > 0 && (
          <div className="pt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Anteriores</p>
            <div className="space-y-3 opacity-50">
              {pasadas.map(r => (
                <ReservaCard
                  key={r.id}
                  reserva={r}
                  esMia={r.user_id === user?.id}
                  onDelete={borrar}
                  onEdit={abrirEditar}
                  deleting={deleting === r.id}
                  pasada
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) cerrarModal() }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl modal-slide-up">
            {/* drag handle for mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-6 pt-4 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">
                {editando ? 'Editar reserva' : 'Nueva reserva'}
              </h3>
              <button
                onClick={cerrarModal}
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  min={editando ? undefined : today}
                  onChange={e => setFecha(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hora inicio</label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={e => setHoraInicio(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Duración</label>
                  <select
                    value={duracion}
                    onChange={e => setDuracion(Number(e.target.value))}
                    className="w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50"
                  >
                    {DURACIONES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Notas <span className="text-gray-300 normal-case font-normal">(opcional)</span>
                </label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Ej. Viaje a Santiago de Compostela"
                  rows={2}
                  className="w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-gray-50 resize-none placeholder:text-gray-400"
                />
              </div>
              {formError && (
                <p className="text-rose-500 text-xs text-center bg-rose-50 px-3 py-2 rounded-lg">{formError}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[.99] disabled:opacity-50 flex items-center justify-center gap-2 min-h-[52px]"
              >
                {submitting
                  ? <><Spinner />Guardando...</>
                  : editando ? 'Guardar cambios' : 'Reservar'
                }
              </button>

              <div className="pb-safe -mb-5" />
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
