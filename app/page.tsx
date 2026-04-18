import Link from 'next/link'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
    title: 'Stock en tiempo real',
    desc: 'Visibilidad exacta de tus unidades disponibles, en tránsito y con alerta de reposición.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    title: 'Picking optimizado',
    desc: 'Lista de picking generada automáticamente desde tus pedidos. Cada operador sabe qué buscar.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    title: 'Packing y despacho',
    desc: 'Confirma bultos, registra guías y sigue cada pedido hasta que salió de tu bodega.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Equipo conectado',
    desc: 'Hasta 5 usuarios por cuenta. Cada uno con acceso a la misma operación en tiempo real.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Ingresa tus pedidos',
    desc: 'Carga los pedidos del día. PYMS genera automáticamente el resumen de unidades necesarias.',
  },
  {
    n: '02',
    title: 'Gestiona stock y picking',
    desc: 'Ve qué hay en stock, qué hay que reponer y asigna tareas de picking a tu equipo.',
  },
  {
    n: '03',
    title: 'Despacha con trazabilidad',
    desc: 'Confirma packing, registra guías de despacho y cierra cada pedido con un clic.',
  },
]

const planIncludes = [
  'Gestión de stock ilimitada',
  'Pedidos y picking diario',
  'Control de packing y despacho',
  'Dashboard con resumen operacional',
  'Hasta 5 usuarios por cuenta',
  'Soporte por email',
]

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-white min-h-screen">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur border-b border-white/5">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <span className="font-black text-lg tracking-tight">PYMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-2"
            >
              Iniciar sesión
            </Link>
            <a
              href="#pricing"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors"
            >
              Comenzar
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-950 border border-indigo-800/50 px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            WMS para Pymes chilenas
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-6">
            Tu bodega bajo{' '}
            <span className="text-indigo-400">control total</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            PYMS es el sistema de gestión de bodega diseñado para pymes. Stock, picking, packing y despacho en una sola herramienta, sin complejidad.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#pricing"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
            >
              Empezar por $9.990/mes
            </a>
            <Link
              href="/login"
              className="w-full sm:w-auto text-slate-300 hover:text-white border border-white/10 hover:border-white/20 font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black tracking-tight mb-3">Todo lo que necesitas</h2>
            <p className="text-slate-400 max-w-md mx-auto">Sin módulos de más, sin configuraciones interminables. Solo lo esencial para operar bien.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-slate-900 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="how" className="py-20 px-5 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black tracking-tight mb-3">Cómo funciona</h2>
            <p className="text-slate-400">Tres pasos. Sin capacitaciones interminables.</p>
          </div>
          <div className="space-y-6">
            {steps.map((s) => (
              <div key={s.n} className="flex gap-6 items-start">
                <div className="text-5xl font-black text-indigo-600/20 leading-none w-14 shrink-0 pt-1">{s.n}</div>
                <div>
                  <h3 className="font-bold text-base mb-1">{s.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-5 border-t border-white/5">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black tracking-tight mb-3">Un plan, todo incluido</h2>
            <p className="text-slate-400">Sin límites de SKUs ni de pedidos.</p>
          </div>
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8">
            <div className="mb-6">
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black">$9.990</span>
                <span className="text-slate-400 text-sm mb-1.5">CLP / mes</span>
              </div>
              <p className="text-slate-400 text-sm">Hasta 5 usuarios. Sin contrato mínimo.</p>
            </div>
            <ul className="space-y-3 mb-8">
              {planIncludes.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="mailto:contacto@pandaneiros.com?subject=Quiero%20suscribirme%20a%20PYMS"
              className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-3.5 rounded-xl text-center transition-colors"
            >
              Suscribirme ahora
            </a>
            <p className="text-center text-xs text-slate-500 mt-4">
              Te contactamos en menos de 24 horas para activar tu cuenta.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <span className="font-black text-sm tracking-tight">PYMS</span>
            <span className="text-slate-600 text-xs">por Pandaneiros</span>
          </div>
          <p className="text-slate-600 text-xs">© 2025 Pandaneiros · pandaneiros.com</p>
          <Link href="/login" className="text-xs text-slate-500 hover:text-white transition-colors">
            Iniciar sesión
          </Link>
        </div>
      </footer>

    </div>
  )
}
