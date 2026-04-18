'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Order = {
  id: string
  reference: string
  customer_name: string | null
  status: 'pending' | 'picking' | 'packing' | 'dispatched' | 'cancelled'
  notes: string | null
  created_at: string
  item_count?: number
}

type Product = {
  id: string
  sku: string
  name: string
  unit: string
  stock_quantity: number
}

type LineItem = {
  product_id: string
  quantity: number
}

const STATUS_META: Record<Order['status'], { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: 'bg-amber-500/10 text-amber-400' },
  picking:    { label: 'Picking',     color: 'bg-blue-500/10 text-blue-400' },
  packing:    { label: 'Packing',     color: 'bg-violet-500/10 text-violet-400' },
  dispatched: { label: 'Despachado',  color: 'bg-emerald-500/10 text-emerald-400' },
  cancelled:  { label: 'Cancelado',   color: 'bg-slate-500/10 text-slate-500' },
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  )
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const m = STATUS_META[status]
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.color}`}>{m.label}</span>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function CreateModal({
  orgId,
  onClose,
  onDone,
}: {
  orgId: string
  onClose: () => void
  onDone: (id: string) => void
}) {
  const [reference, setReference] = useState(`PED-${Date.now().toString().slice(-6)}`)
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [lines, setLines] = useState<LineItem[]>([{ product_id: '', quantity: 1 }])
  const [loading, setLoading] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('products').select('id,sku,name,unit,stock_quantity').order('name')
      .then(({ data }) => { if (data) setProducts(data); setLoadingProducts(false) })
  }, [])

  function addLine() {
    setLines(l => [...l, { product_id: '', quantity: 1 }])
  }

  function removeLine(i: number) {
    setLines(l => l.filter((_, idx) => idx !== i))
  }

  function setLine(i: number, key: keyof LineItem, val: string | number) {
    setLines(l => l.map((line, idx) => idx === i ? { ...line, [key]: val } : line))
    setError('')
  }

  function selectedProductIds() {
    return lines.map(l => l.product_id).filter(Boolean)
  }

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validLines = lines.filter(l => l.product_id && l.quantity > 0)
    if (validLines.length === 0) { setError('Agrega al menos un producto'); return }

    const dupes = validLines.map(l => l.product_id)
    if (new Set(dupes).size !== dupes.length) { setError('Hay productos duplicados'); return }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        org_id: orgId,
        reference: reference.trim(),
        customer_name: customerName.trim() || null,
        notes: notes.trim() || null,
        status: 'pending',
        created_by: user?.id,
      })
      .select('id')
      .single()

    if (orderErr || !order) {
      setError(orderErr?.code === '23505' ? `Referencia "${reference}" ya existe` : (orderErr?.message ?? 'Error'))
      setLoading(false)
      return
    }

    const { error: itemsErr } = await supabase.from('order_items').insert(
      validLines.map(l => ({
        order_id: order.id,
        product_id: l.product_id,
        quantity_ordered: l.quantity,
        quantity_picked: 0,
      }))
    )

    if (itemsErr) {
      await supabase.from('orders').delete().eq('id', order.id)
      setError(itemsErr.message)
      setLoading(false)
      return
    }

    onDone(order.id)
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white">Nuevo pedido</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handle} className="p-6 space-y-5">
          {/* Header fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Referencia</label>
              <input
                type="text" value={reference} onChange={e => setReference(e.target.value)} required
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cliente <span className="text-slate-600 normal-case font-normal">(opcional)</span></label>
              <input
                type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Notas <span className="text-slate-600 normal-case font-normal">(opcional)</span></label>
              <input
                type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Instrucciones adicionales"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Productos</label>
              <button type="button" onClick={addLine}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                + Agregar línea
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex justify-center py-6"><Spinner className="w-5 h-5 text-indigo-500" /></div>
            ) : (
              <div className="space-y-2">
                {lines.map((line, i) => {
                  const prod = products.find(p => p.id === line.product_id)
                  const stockOk = prod ? prod.stock_quantity >= line.quantity : true
                  const taken = selectedProductIds().filter(id => id === line.product_id).length > 1

                  return (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <select
                          value={line.product_id}
                          onChange={e => setLine(i, 'product_id', e.target.value)}
                          required
                          className="w-full px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                        >
                          <option value="">— Seleccionar producto —</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.sku} · {p.name} (stock: {p.stock_quantity})
                            </option>
                          ))}
                        </select>
                        {prod && (
                          <p className={`text-xs mt-1 ml-1 ${!stockOk ? 'text-amber-400' : taken ? 'text-rose-400' : 'text-slate-600'}`}>
                            {taken ? 'Producto duplicado' : !stockOk ? `Stock insuficiente (disponible: ${prod.stock_quantity})` : `Stock disponible: ${prod.stock_quantity} ${prod.unit}s`}
                          </p>
                        )}
                      </div>
                      <div className="w-24 shrink-0">
                        <input
                          type="number" min="1" value={line.quantity}
                          onChange={e => setLine(i, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-center"
                        />
                      </div>
                      {lines.length > 1 && (
                        <button type="button" onClick={() => removeLine(i)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error && (
            <p className="text-rose-400 text-xs text-center bg-rose-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Spinner /> : 'Crear pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'picking', label: 'Picking' },
  { value: 'packing', label: 'Packing' },
  { value: 'dispatched', label: 'Despachado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('organization_members').select('org_id').eq('user_id', user.id).single()
    if (!membership) return
    setOrgId(membership.org_id)

    let q = supabase
      .from('orders')
      .select('id, reference, customer_name, status, notes, created_at, order_items(count)')
      .order('created_at', { ascending: false })

    if (statusFilter) q = q.eq('status', statusFilter)

    const { data } = await q
    if (data) {
      setOrders(data.map((o: Order & { order_items: { count: number }[] }) => ({
        ...o,
        item_count: o.order_items?.[0]?.count ?? 0,
      })))
    }
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const active = orders.filter(o => !['dispatched', 'cancelled'].includes(o.status)).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Pedidos</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            {active > 0 && <span className="ml-2 text-indigo-400">· {active} activos</span>}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === f.value
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-7 h-7 text-indigo-500" />
        </div>
      ) : orders.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-2xl py-16 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">Sin pedidos{statusFilter ? ' en este estado' : ''}</p>
          {!statusFilter && (
            <button onClick={() => setShowCreate(true)}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 px-4 py-2 rounded-xl transition-colors">
              Crear primer pedido
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <Link
              key={o.id}
              href={`/app/pedidos/${o.id}`}
              className="block bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">{o.reference}</p>
                    {o.customer_name && (
                      <p className="text-slate-500 text-xs">· {o.customer_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <StatusBadge status={o.status} />
                    <p className="text-xs text-slate-600">
                      {o.item_count} producto{o.item_count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-600">{formatDate(o.created_at)}</p>
                  </div>
                  {o.notes && <p className="text-xs text-slate-600 mt-1.5 truncate">{o.notes}</p>}
                </div>
                <svg className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal
          orgId={orgId}
          onClose={() => setShowCreate(false)}
          onDone={() => { setShowCreate(false); load() }}
        />
      )}
    </div>
  )
}
