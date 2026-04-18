'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Product = {
  id: string
  sku: string
  name: string
  unit: string
  stock_quantity: number
  reorder_threshold: number
  created_at: string
}

type FormData = {
  sku: string
  name: string
  unit: string
  stock_quantity: string
  reorder_threshold: string
}

const EMPTY_FORM: FormData = {
  sku: '',
  name: '',
  unit: 'unidad',
  stock_quantity: '0',
  reorder_threshold: '0',
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  )
}

function StockBadge({ qty, threshold }: { qty: number; threshold: number }) {
  if (qty <= 0)
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Sin stock</span>
  if (threshold > 0 && qty <= threshold)
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Reponer</span>
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">OK</span>
}

function AdjustModal({
  product,
  onClose,
  onDone,
}: {
  product: Product
  onClose: () => void
  onDone: () => void
}) {
  const [delta, setDelta] = useState('')
  const [type, setType] = useState<'add' | 'remove'>('add')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const preview = (() => {
    const n = parseInt(delta) || 0
    return type === 'add' ? product.stock_quantity + n : product.stock_quantity - n
  })()

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(delta)
    if (!n || n <= 0) { setError('Ingresa una cantidad válida'); return }
    const next = type === 'add' ? product.stock_quantity + n : product.stock_quantity - n
    if (next < 0) { setError('El stock no puede quedar negativo'); return }
    setLoading(true)
    const { error: err } = await supabase
      .from('products')
      .update({ stock_quantity: next })
      .eq('id', product.id)
    if (err) { setError(err.message); setLoading(false); return }
    onDone()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full sm:max-w-sm p-6 space-y-5">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Ajustar stock</p>
          <h3 className="font-bold text-white">{product.name}</h3>
          <p className="text-slate-500 text-sm">Stock actual: <span className="text-white font-semibold">{product.stock_quantity}</span></p>
        </div>

        <form onSubmit={handle} className="space-y-4">
          <div className="flex gap-2">
            {(['add', 'remove'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  type === t
                    ? t === 'add' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {t === 'add' ? '+ Agregar' : '− Retirar'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Cantidad ({product.unit}s)
            </label>
            <input
              type="number"
              min="1"
              value={delta}
              onChange={e => { setDelta(e.target.value); setError('') }}
              autoFocus
              placeholder="0"
              className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
            />
          </div>

          {delta && !error && (
            <p className="text-xs text-slate-400 text-center">
              Stock resultante:{' '}
              <span className={`font-bold ${preview < 0 ? 'text-red-400' : 'text-white'}`}>
                {preview} {product.unit}s
              </span>
            </p>
          )}

          {error && (
            <p className="text-rose-400 text-xs text-center bg-rose-400/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Spinner /> : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProductModal({
  product,
  orgId,
  onClose,
  onDone,
}: {
  product: Product | null
  orgId: string
  onClose: () => void
  onDone: () => void
}) {
  const [form, setForm] = useState<FormData>(
    product
      ? {
          sku: product.sku,
          name: product.name,
          unit: product.unit,
          stock_quantity: String(product.stock_quantity),
          reorder_threshold: String(product.reorder_threshold),
        }
      : EMPTY_FORM
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(k: keyof FormData, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setError('')
  }

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      unit: form.unit.trim() || 'unidad',
      stock_quantity: parseInt(form.stock_quantity) || 0,
      reorder_threshold: parseInt(form.reorder_threshold) || 0,
    }

    if (product) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', product.id)
      if (err) { setError(err.message); setLoading(false); return }
    } else {
      const { error: err } = await supabase.from('products').insert({ ...payload, org_id: orgId })
      if (err) {
        setError(err.code === '23505' ? `SKU "${payload.sku}" ya existe` : err.message)
        setLoading(false)
        return
      }
    }
    onDone()
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full sm:max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white">{product ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handle} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">SKU</label>
              <input type="text" value={form.sku} onChange={e => set('sku', e.target.value)} required placeholder="Ej. CAMISA-XL-AZL"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Unidad</label>
              <input type="text" value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="unidad, caja, kg…"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Nombre</label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Ej. Camisa Oxford XL Azul"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Stock inicial</label>
              <input type="number" min="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} placeholder="0"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Umbral reposición</label>
              <input type="number" min="0" value={form.reorder_threshold} onChange={e => set('reorder_threshold', e.target.value)} placeholder="0"
                className="w-full px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600" />
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
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Spinner /> : product ? 'Guardar' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Actions({
  p, confirmDelete, deleting, onAdjust, onEdit, onDeleteRequest, onDeleteCancel, onDeleteConfirm,
}: {
  p: Product; confirmDelete: string | null; deleting: string | null
  onAdjust: () => void; onEdit: () => void
  onDeleteRequest: () => void; onDeleteCancel: () => void; onDeleteConfirm: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onAdjust} title="Ajustar stock"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>
      <button onClick={onEdit} title="Editar"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {confirmDelete === p.id ? (
        <div className="flex gap-1">
          <button onClick={onDeleteConfirm} disabled={deleting === p.id}
            className="h-8 px-2.5 flex items-center rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50">
            {deleting === p.id ? <Spinner className="w-3 h-3" /> : 'Sí'}
          </button>
          <button onClick={onDeleteCancel}
            className="h-8 px-2.5 flex items-center rounded-lg text-xs font-bold text-slate-400 bg-white/5 hover:bg-white/10 transition-colors">
            No
          </button>
        </div>
      ) : (
        <button onClick={onDeleteRequest} title="Eliminar"
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orgId, setOrgId] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<'create' | 'edit' | 'adjust' | null>(null)
  const [selected, setSelected] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) return
    setOrgId(membership.org_id)

    const { data } = await supabase.from('products').select('*').order('name')
    if (data) setProducts(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('products').delete().eq('id', id)
    setProducts(p => p.filter(x => x.id !== id))
    setConfirmDelete(null)
    setDeleting(null)
  }

  const filtered = products.filter(p =>
    search === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const lowStock = products.filter(p => p.reorder_threshold > 0 && p.stock_quantity <= p.reorder_threshold).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Productos</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {products.length} producto{products.length !== 1 ? 's' : ''}
            {lowStock > 0 && <span className="ml-2 text-amber-400">· {lowStock} por reponer</span>}
          </p>
        </div>
        <button
          onClick={() => { setSelected(null); setModal('create') }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </button>
      </div>

      <div className="relative mb-5">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o SKU…"
          className="w-full pl-10 pr-4 py-2.5 text-sm text-white bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition placeholder:text-slate-600"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-7 h-7 text-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-2xl py-16 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
            <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">{search ? 'Sin resultados' : 'Sin productos aún'}</p>
          {!search && (
            <button
              onClick={() => { setSelected(null); setModal('create') }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 px-4 py-2 rounded-xl transition-colors"
            >
              Crear primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-white/5">
            {['SKU', 'Nombre', 'Unidad', 'Stock', 'Estado', ''].map(h => (
              <p key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</p>
            ))}
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map(p => (
              <div key={p.id} className="px-5 py-4">
                <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                  <p className="text-xs font-mono font-bold text-slate-400">{p.sku}</p>
                  <p className="text-sm font-semibold text-white">{p.name}</p>
                  <p className="text-sm text-slate-400">{p.unit}</p>
                  <p className="text-sm font-bold text-white">{p.stock_quantity}</p>
                  <StockBadge qty={p.stock_quantity} threshold={p.reorder_threshold} />
                  <Actions p={p} confirmDelete={confirmDelete} deleting={deleting}
                    onAdjust={() => { setSelected(p); setModal('adjust') }}
                    onEdit={() => { setSelected(p); setModal('edit') }}
                    onDeleteRequest={() => setConfirmDelete(p.id)}
                    onDeleteCancel={() => setConfirmDelete(null)}
                    onDeleteConfirm={() => handleDelete(p.id)} />
                </div>
                <div className="md:hidden space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-white">{p.name}</p>
                      <p className="text-xs font-mono text-slate-500">{p.sku}</p>
                    </div>
                    <StockBadge qty={p.stock_quantity} threshold={p.reorder_threshold} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      <span className="font-bold text-white">{p.stock_quantity}</span> {p.unit}s
                      {p.reorder_threshold > 0 && <span className="text-slate-600"> · umbral {p.reorder_threshold}</span>}
                    </p>
                    <Actions p={p} confirmDelete={confirmDelete} deleting={deleting}
                      onAdjust={() => { setSelected(p); setModal('adjust') }}
                      onEdit={() => { setSelected(p); setModal('edit') }}
                      onDeleteRequest={() => setConfirmDelete(p.id)}
                      onDeleteCancel={() => setConfirmDelete(null)}
                      onDeleteConfirm={() => handleDelete(p.id)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(modal === 'create' || modal === 'edit') && (
        <ProductModal
          product={modal === 'edit' ? selected : null}
          orgId={orgId}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load() }}
        />
      )}

      {modal === 'adjust' && selected && (
        <AdjustModal
          product={selected}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
