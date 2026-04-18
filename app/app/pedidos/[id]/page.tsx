'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type OrderStatus = 'pending' | 'picking' | 'packing' | 'dispatched' | 'cancelled'

type OrderItem = {
  id: string
  quantity_ordered: number
  quantity_picked: number
  products: {
    id: string
    sku: string
    name: string
    unit: string
    stock_quantity: number
  }
}

type Order = {
  id: string
  reference: string
  customer_name: string | null
  status: OrderStatus
  notes: string | null
  created_at: string
  order_items: OrderItem[]
}

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pendiente',   color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  picking:    { label: 'Picking',     color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  packing:    { label: 'Packing',     color: 'text-violet-400',  bg: 'bg-violet-500/10' },
  dispatched: { label: 'Despachado',  color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  cancelled:  { label: 'Cancelado',   color: 'text-slate-500',   bg: 'bg-slate-500/10' },
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'picking',
  picking: 'packing',
  packing: 'dispatched',
}

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: 'Iniciar picking',
  picking: 'Pasar a packing',
  packing: 'Marcar despachado',
}

const PIPELINE: OrderStatus[] = ['pending', 'picking', 'packing', 'dispatched']

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [advancing, setAdvancing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, reference, customer_name, status, notes, created_at,
        order_items (
          id, quantity_ordered, quantity_picked,
          products ( id, sku, name, unit, stock_quantity )
        )
      `)
      .eq('id', id)
      .single()

    if (data) setOrder(data as unknown as Order)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function advance() {
    if (!order) return
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setAdvancing(true)
    await supabase.from('orders').update({ status: next, updated_at: new Date().toISOString() }).eq('id', order.id)
    await load()
    setAdvancing(false)
  }

  async function cancel() {
    if (!order) return
    setCancelling(true)
    await supabase.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', order.id)
    await load()
    setCancelling(false)
    setConfirmCancel(false)
  }

  async function deleteOrder() {
    if (!order) return
    setDeleting(true)
    await supabase.from('orders').delete().eq('id', order.id)
    router.replace('/app/pedidos')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="w-7 h-7 text-indigo-500" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Pedido no encontrado</p>
        <Link href="/app/pedidos" className="text-indigo-400 text-sm mt-2 inline-block">← Volver</Link>
      </div>
    )
  }

  const meta = STATUS_META[order.status]
  const nextStatus = NEXT_STATUS[order.status]
  const nextLabel = NEXT_LABEL[order.status]
  const isActive = !['dispatched', 'cancelled'].includes(order.status)
  const currentStep = PIPELINE.indexOf(order.status)

  const totalUnits = order.order_items.reduce((s, i) => s + i.quantity_ordered, 0)
  const stockIssues = order.order_items.filter(i => i.products.stock_quantity < i.quantity_ordered)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/app/pedidos" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mb-5 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Pedidos
      </Link>

      {/* Header */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">{order.reference}</h1>
            {order.customer_name && <p className="text-slate-400 text-sm mt-0.5">{order.customer_name}</p>}
            <p className="text-slate-600 text-xs mt-1">{formatDate(order.created_at)}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${meta.bg} ${meta.color} shrink-0`}>
            {meta.label}
          </span>
        </div>

        {/* Pipeline */}
        <div className="flex items-center gap-0 mb-4">
          {PIPELINE.map((s, i) => {
            const done = currentStep > i || order.status === 'dispatched'
            const active = currentStep === i && order.status !== 'cancelled'
            return (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex-1 h-1 rounded-full ${
                  i === 0 ? 'hidden' : done ? 'bg-indigo-600' : 'bg-white/5'
                }`} />
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  done ? 'bg-indigo-600' : active ? 'bg-indigo-400 ring-2 ring-indigo-400/30' : 'bg-white/10'
                }`} />
                <div className={`flex-1 h-1 rounded-full ${
                  i === PIPELINE.length - 1 ? 'hidden' : done && currentStep > i + 1 ? 'bg-indigo-600' : 'bg-white/5'
                }`} />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between">
          {PIPELINE.map((s, i) => (
            <p key={s} className={`text-xs ${currentStep === i && order.status !== 'cancelled' ? 'text-white font-semibold' : 'text-slate-600'}`}>
              {STATUS_META[s].label}
            </p>
          ))}
        </div>

        {order.notes && (
          <p className="text-xs text-slate-500 bg-white/5 rounded-xl px-3 py-2 mt-4">{order.notes}</p>
        )}
      </div>

      {/* Stock warning */}
      {isActive && stockIssues.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 mb-4">
          <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-amber-400 mb-0.5">Stock insuficiente</p>
            {stockIssues.map(i => (
              <p key={i.id} className="text-xs text-amber-300/70">
                {i.products.name}: necesita {i.quantity_ordered}, disponible {i.products.stock_quantity}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Productos</p>
          <p className="text-xs text-slate-600">{totalUnits} unidades total</p>
        </div>
        <div className="divide-y divide-white/5">
          {order.order_items.map(item => {
            const stockOk = item.products.stock_quantity >= item.quantity_ordered
            return (
              <div key={item.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{item.products.name}</p>
                  <p className="text-xs font-mono text-slate-500">{item.products.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">
                    {item.quantity_ordered} <span className="text-slate-500 font-normal text-xs">{item.products.unit}s</span>
                  </p>
                  <p className={`text-xs ${stockOk ? 'text-slate-600' : 'text-amber-400'}`}>
                    stock: {item.products.stock_quantity}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="space-y-2">
          {nextStatus && nextLabel && (
            <button
              onClick={advance}
              disabled={advancing}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3.5 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {advancing ? <Spinner /> : (
                <>
                  {nextLabel}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          )}

          {confirmCancel ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmCancel(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">
                No cancelar
              </button>
              <button onClick={cancel} disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {cancelling ? <Spinner /> : 'Confirmar cancelación'}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmCancel(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors">
              Cancelar pedido
            </button>
          )}
        </div>
      )}

      {/* Delete (cancelled only) */}
      {order.status === 'cancelled' && (
        <div className="mt-4">
          {confirmDelete ? (
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">
                Mantener
              </button>
              <button onClick={deleteOrder} disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <Spinner /> : 'Eliminar definitivamente'}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors">
              Eliminar pedido
            </button>
          )}
        </div>
      )}
    </div>
  )
}
