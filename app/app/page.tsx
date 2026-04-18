'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Stats = {
  pending: number
  picking: number
  packing: number
  dispatched_today: number
  low_stock: number
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendientes',
  picking: 'En picking',
  packing: 'En packing',
  dispatched: 'Despachados hoy',
}

function StatCard({
  label,
  value,
  color,
  href,
}: {
  label: string
  value: number
  color: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="bg-slate-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors block"
    >
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </Link>
  )
}

export default function AppDashboard() {
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    picking: 0,
    packing: 0,
    dispatched_today: 0,
    low_stock: 0,
  })
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from('organization_members')
        .select('org_id, organizations(name)')
        .eq('user_id', user.id)
        .single()

      if (!membership) return
      const org = membership.organizations as unknown as { name: string } | null
      setOrgName(org?.name ?? '')

      const today = new Date().toISOString().split('T')[0]

      const [pendingRes, pickingRes, packingRes, dispatchedRes, lowStockRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'picking'),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'packing'),
        supabase.from('dispatch_records').select('id', { count: 'exact', head: true })
          .gte('dispatched_at', `${today}T00:00:00`),
        supabase.from('products').select('id', { count: 'exact', head: true })
          .filter('stock_quantity', 'lte', 'reorder_threshold'),
      ])

      setStats({
        pending: pendingRes.count ?? 0,
        picking: pickingRes.count ?? 0,
        packing: packingRes.count ?? 0,
        dispatched_today: dispatchedRes.count ?? 0,
        low_stock: lowStockRes.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-slate-500 text-sm mb-1">Bienvenido a</p>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {orgName || 'PYMS'}
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-900 border border-white/5 rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Pendientes" value={stats.pending} color="text-amber-400" href="/app/pedidos?status=pending" />
            <StatCard label="En picking" value={stats.picking} color="text-blue-400" href="/app/picking" />
            <StatCard label="En packing" value={stats.packing} color="text-violet-400" href="/app/despacho" />
            <StatCard label="Despachados hoy" value={stats.dispatched_today} color="text-emerald-400" href="/app/despacho" />
          </div>

          {/* Low stock alert */}
          {stats.low_stock > 0 && (
            <Link
              href="/app/productos"
              className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 hover:border-amber-500/40 transition-colors"
            >
              <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-300">
                <span className="font-bold">{stats.low_stock} producto{stats.low_stock !== 1 ? 's' : ''}</span>
                {' '}bajo el umbral de reposición
              </p>
            </Link>
          )}

          {/* Empty state */}
          {stats.pending === 0 && stats.picking === 0 && stats.packing === 0 && stats.low_stock === 0 && (
            <div className="border border-dashed border-white/10 rounded-2xl py-16 flex flex-col items-center gap-4 mt-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-slate-400 font-semibold text-sm">Todo en orden</p>
                <p className="text-slate-600 text-xs mt-1">No hay pedidos activos ni alertas de stock</p>
              </div>
              <Link
                href="/app/pedidos"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/40 px-4 py-2 rounded-xl transition-colors"
              >
                Crear primer pedido
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
