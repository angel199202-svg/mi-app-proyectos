'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type PickItem = {
  id: string
  quantity_ordered: number
  quantity_picked: number
  products: {
    id: string
    sku: string
    name: string
    unit: string
  }
}

type PickOrder = {
  id: string
  reference: string
  customer_name: string | null
  order_items: PickItem[]
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  )
}

function ProgressBar({ picked, total }: { picked: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((picked / total) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${pct === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
        {picked}/{total}
      </span>
    </div>
  )
}

function OrderPickCard({
  order,
  onUpdate,
  onAdvance,
}: {
  order: PickOrder
  onUpdate: (itemId: string, qty: number) => Promise<void>
  onAdvance: (orderId: string) => Promise<void>
}) {
  const [saving, setSaving] = useState<string | null>(null)
  const [advancing, setAdvancing] = useState(false)
  const [localQty, setLocalQty] = useState<Record<string, string>>(() =>
    Object.fromEntries(order.order_items.map(i => [i.id, String(i.quantity_picked)]))
  )

  const totalOrdered = order.order_items.reduce((s, i) => s + i.quantity_ordered, 0)
  const totalPicked = order.order_items.reduce((s, i) => s + (parseInt(localQty[i.id]) || 0), 0)
  const allPicked = order.order_items.every(i => (parseInt(localQty[i.id]) || 0) >= i.quantity_ordered)

  async function saveItem(item: PickItem) {
    const qty = Math.min(parseInt(localQty[item.id]) || 0, item.quantity_ordered)
    setLocalQty(q => ({ ...q, [item.id]: String(qty) }))
    setSaving(item.id)
    await onUpdate(item.id, qty)
    setSaving(null)
  }

  async function handleAdvance() {
    setAdvancing(true)
    await onAdvance(order.id)
    setAdvancing(false)
  }

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
      {/* Order header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-white text-sm">{order.reference}</p>
              {order.customer_name && (
                <p className="text-slate-500 text-xs">· {order.customer_name}</p>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {order.order_items.length} producto{order.order_items.length !== 1 ? 's' : ''}
            </p>
          </div>
          {allPicked && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0">
              Completo
            </span>
          )}
        </div>
        <ProgressBar picked={totalPicked} total={totalOrdered} />
      </div>

      {/* Items */}
      <div className="divide-y divide-white/5">
        {order.order_items.map(item => {
          const picked = parseInt(localQty[item.id]) || 0
          const done = picked >= item.quantity_ordered
          return (
            <div key={item.id} className={`px-5 py-3.5 flex items-center gap-3 transition-colors ${done ? 'opacity-60' : ''}`}>
              {/* Check indicator */}
              <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border ${
                done ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'
              }`}>
                {done && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${done ? 'line-through text-slate-500' : 'text-white'}`}>
                  {item.products.name}
                </p>
                <p className="text-xs font-mono text-slate-600">{item.products.sku}</p>
              </div>

              {/* Qty needed */}
              <p className="text-xs text-slate-500 shrink-0">
                de <span className="text-white font-bold">{item.quantity_ordered}</span>
              </p>

              {/* Picked input */}
              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  max={item.quantity_ordered}
                  value={localQty[item.id]}
                  onChange={e => setLocalQty(q => ({ ...q, [item.id]: e.target.value }))}
                  onBlur={() => saveItem(item)}
                  className={`w-16 text-center px-2 py-1.5 text-sm font-bold rounded-lg border outline-none transition ${
                    done
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                />
                {saving === item.id && <Spinner className="w-3 h-3 text-slate-500" />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Advance action */}
      <div className="px-5 py-4 border-t border-white/5">
        {allPicked ? (
          <button
            onClick={handleAdvance}
            disabled={advancing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {advancing ? <Spinner /> : (
              <>
                Pasar a packing
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <p className="text-center text-xs text-slate-600">
            Completa todos los ítems para avanzar a packing
          </p>
        )}
      </div>
    </div>
  )
}

export default function PickingPage() {
  const [orders, setOrders] = useState<PickOrder[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, reference, customer_name,
        order_items (
          id, quantity_ordered, quantity_picked,
          products ( id, sku, name, unit )
        )
      `)
      .eq('status', 'picking')
      .order('created_at', { ascending: true })

    if (data) setOrders(data as unknown as PickOrder[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateItem(itemId: string, qty: number) {
    await supabase
      .from('order_items')
      .update({ quantity_picked: qty })
      .eq('id', itemId)
  }

  async function advanceOrder(orderId: string) {
    await supabase
      .from('orders')
      .update({ status: 'packing', updated_at: new Date().toISOString() })
      .eq('id', orderId)
    setOrders(o => o.filter(x => x.id !== orderId))
  }

  const totalItems = orders.reduce((s, o) => s + o.order_items.length, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Picking</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {loading ? '…' : orders.length === 0
            ? 'Sin pedidos en picking'
            : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} · ${totalItems} ítem${totalItems !== 1 ? 's' : ''} a recolectar`
          }
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-7 h-7 text-indigo-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-2xl py-16 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">Sin pedidos en picking</p>
          <Link
            href="/app/pedidos"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 px-4 py-2 rounded-xl transition-colors"
          >
            Ver pedidos pendientes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderPickCard
              key={order.id}
              order={order}
              onUpdate={updateItem}
              onAdvance={advanceOrder}
            />
          ))}
        </div>
      )}
    </div>
  )
}
