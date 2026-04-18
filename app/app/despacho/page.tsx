'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type DispatchItem = {
  id: string
  quantity_ordered: number
  quantity_picked: number
  products: { sku: string; name: string; unit: string }
}

type DispatchOrder = {
  id: string
  reference: string
  customer_name: string | null
  notes: string | null
  created_at: string
  order_items: DispatchItem[]
}

type DispatchRecord = {
  id: string
  order_id: string
  tracking_number: string | null
  carrier: string | null
  dispatched_at: string
  orders: { reference: string; customer_name: string | null }
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function DispatchModal({
  order,
  onClose,
  onDone,
}: {
  order: DispatchOrder
  onClose: () => void
  onDone: () => void
}) {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalUnits = order.order_items.reduce((s, i) => s + i.quantity_picked, 0)

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { error: recErr } = await supabase.from('dispatch_records').insert({
      order_id: order.id,
      tracking_number: trackingNumber.trim() || null,
      carrier: carrier.trim() || null,
      notes: notes.trim() || null,
      dispatched_by: user?.id,
    })

    if (recErr) { setError(recErr.message); setLoading(false); return }

    await supabase.from('orders').update({
      status: 'dispatched',
      updated_at: new Date().toISOString(),
    }).eq('id', order.id)

    onDone()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full sm:max-w-md">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white">Confirmar despacho</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handle} className="p-6 space-y-4">
          {/* Order summary */}
          <div className="bg-white/5 rounded-xl px-4 py-3 space-y-1">
            <p className="font-bold text-white text-sm">{order.reference}</p>
            {order.customer_name && <p className="text-slate-400 text-xs">{order.customer_name}</p>}
            <p className="text-slate-600 text-xs">{totalUnits} unidades · {order.order_items.length} producto{order.order_items.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Items recap */}
          <div className="space-y-1.5">
            {order.order_items.map(item => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate">{item.products.name}</span>
                <span className="text-white font-bold shrink-0 ml-2">{item.quantity_picked} {item.products.unit}s</span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                N° de seguimiento <span className="text-slate-600 normal-case font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="Ej. 1234567890"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Carrier <span className="text-slate-600 normal-case font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={carrier}
                onChange={e => setCarrier(e.target.value)}
                placeholder="Ej. Chilexpress, Starken, retiro en tienda…"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Notas <span className="text-slate-600 normal-case font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observaciones del despacho"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
              />
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-xs text-center bg-rose-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Spinner /> : 'Confirmar despacho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DespachoPage() {
  const [packingOrders, setPackingOrders] = useState<DispatchOrder[]>([])
  const [recentDispatched, setRecentDispatched] = useState<DispatchRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dispatchModal, setDispatchModal] = useState<DispatchOrder | null>(null)

  const load = useCallback(async () => {
    const [packingRes, dispatchedRes] = await Promise.all([
      supabase
        .from('orders')
        .select(`
          id, reference, customer_name, notes, created_at,
          order_items ( id, quantity_ordered, quantity_picked, products ( sku, name, unit ) )
        `)
        .eq('status', 'packing')
        .order('created_at', { ascending: true }),

      supabase
        .from('dispatch_records')
        .select('id, order_id, tracking_number, carrier, dispatched_at, orders ( reference, customer_name )')
        .order('dispatched_at', { ascending: false })
        .limit(10),
    ])

    if (packingRes.data) setPackingOrders(packingRes.data as unknown as DispatchOrder[])
    if (dispatchedRes.data) setRecentDispatched(dispatchedRes.data as unknown as DispatchRecord[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Despacho</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {loading ? '…' : `${packingOrders.length} en packing · ${recentDispatched.length} despachados recientes`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-7 h-7 text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Packing — ready to dispatch */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Listos para despachar
            </p>

            {packingOrders.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-2xl py-10 flex flex-col items-center gap-2">
                <p className="text-slate-600 text-sm">Sin pedidos en packing</p>
                <Link href="/app/picking" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Ver picking activo →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {packingOrders.map(order => {
                  const totalUnits = order.order_items.reduce((s, i) => s + i.quantity_picked, 0)
                  return (
                    <div key={order.id} className="bg-slate-900 border border-white/5 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white text-sm">{order.reference}</p>
                            {order.customer_name && (
                              <p className="text-slate-500 text-xs">· {order.customer_name}</p>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {totalUnits} unidades · {order.order_items.length} producto{order.order_items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 shrink-0">
                          Packing
                        </span>
                      </div>

                      {/* Items recap */}
                      <div className="bg-white/3 rounded-xl divide-y divide-white/5 mb-4 overflow-hidden">
                        {order.order_items.map(item => (
                          <div key={item.id} className="flex items-center justify-between px-3 py-2">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{item.products.name}</p>
                              <p className="text-xs font-mono text-slate-600">{item.products.sku}</p>
                            </div>
                            <p className="text-xs font-bold text-emerald-400 shrink-0 ml-3">
                              {item.quantity_picked} {item.products.unit}s
                            </p>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setDispatchModal(order)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Despachar
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent dispatched */}
          {recentDispatched.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Despachados recientes
              </p>
              <div className="bg-slate-900 border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden">
                {recentDispatched.map(rec => {
                  const ord = rec.orders as unknown as { reference: string; customer_name: string | null }
                  return (
                    <div key={rec.id} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{ord?.reference}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {ord?.customer_name && <p className="text-xs text-slate-500">{ord.customer_name}</p>}
                          {rec.carrier && <p className="text-xs text-slate-600">· {rec.carrier}</p>}
                          {rec.tracking_number && (
                            <p className="text-xs font-mono text-slate-600">· {rec.tracking_number}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 shrink-0">{formatDate(rec.dispatched_at)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {dispatchModal && (
        <DispatchModal
          order={dispatchModal}
          onClose={() => setDispatchModal(null)}
          onDone={() => { setDispatchModal(null); load() }}
        />
      )}
    </div>
  )
}
