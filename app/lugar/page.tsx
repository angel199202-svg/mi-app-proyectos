import Link from 'next/link'

export default function LugarPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>

      {/* Back */}
      <Link
        href="/"
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--olive)',
          opacity: 0.65,
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          zIndex: 10,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M13 7H1M6 2L1 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        Inicio
      </Link>

      {/* Hero */}
      <section
        style={{
          padding: '120px 24px 80px',
          textAlign: 'center',
          background: 'var(--warm)',
          borderBottom: '1px solid var(--sand)',
        }}
      >
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '16px' }}>
          El lugar
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 7vw, 64px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'var(--olive)',
            marginBottom: '20px',
          }}
        >
          {/* TODO: reemplaza con el nombre real */}
          [Nombre del lugar]
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--muted)', marginBottom: '6px' }}>
          {/* TODO */}
          [Dirección completa]
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '18px', color: 'var(--text)', opacity: 0.7 }}>
          {/* TODO */}
          Sábado · [Fecha] · [Hora]
        </p>
      </section>

      {/* Map */}
      <section style={{ background: 'var(--sand)', height: '420px', position: 'relative', overflow: 'hidden' }}>
        {/*
          TODO: Reemplaza este placeholder con un iframe de Google Maps:
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!...TU_EMBED_URL"
            width="100%"
            height="420"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px',
            background: 'var(--sand)',
          }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.45 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#6a6b4b" strokeWidth="1.4" />
            <circle cx="12" cy="9" r="2.5" stroke="#6a6b4b" strokeWidth="1.4" />
          </svg>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--olive)', opacity: 0.55 }}>
            Agrega el mapa en app/lugar/page.tsx
          </p>
        </div>
      </section>

      {/* Info cards */}
      <section style={{ padding: '64px 24px', background: 'var(--cream)' }}>
        <div
          style={{
            maxWidth: 800,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {[
            {
              icon: '🗓',
              title: 'Fecha y hora',
              lines: ['Sábado · [Fecha del evento] {/* TODO */}', 'A las [Hora de inicio]', 'Llegada: 30 min antes'],
            },
            {
              icon: '🚗',
              title: 'Cómo llegar',
              lines: ['[Instrucciones de acceso]', '[Referencia o hito]', 'Coordenadas disponibles pronto'],
            },
            {
              icon: '🅿️',
              title: 'Estacionamiento',
              lines: ['[Disponibilidad]', '[Instrucciones especiales]'],
            },
          ].map((card) => (
            <div key={card.title} className="info-card">
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{card.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: 'var(--olive)', marginBottom: '12px' }}>
                {card.title}
              </h3>
              {card.lines.map((line, i) => (
                <p key={i} style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Dress code */}
      <section style={{ padding: '64px 24px', background: 'var(--warm)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>
            Vestimenta
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--olive)', marginBottom: '24px' }}>
            Elegante formal
          </h2>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '17px', color: 'var(--text)', opacity: 0.8, lineHeight: 1.75, marginBottom: '20px' }}>
            Queremos que este día sea especial para todos. Te pedimos asistir
            con vestimenta elegante que acompañe la atmósfera del evento.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: 400, margin: '0 auto' }}>
            {[
              { label: 'Mujeres', suggestion: 'Vestido largo o traje de noche' },
              { label: 'Hombres', suggestion: 'Traje oscuro o smoking' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: 'var(--cream)',
                  border: '1px solid var(--sand)',
                  borderRadius: '3px',
                  padding: '16px',
                }}
              >
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>
                  {item.label}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>
                  {item.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Condiciones del evento */}
      <section id="condiciones" style={{ padding: '64px 24px', background: 'var(--olive)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--rose)', opacity: 0.8, marginBottom: '12px' }}>
              Importante
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 300, fontStyle: 'italic', color: 'var(--cream)', marginBottom: '16px' }}>
              Sobre nuestra celebración
            </h2>
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '17px', color: 'var(--sand)', opacity: 0.85, lineHeight: 1.7 }}>
              Queremos ser honestos con ustedes sobre lo que esperamos de este día,
              porque para nosotros cada invitado es especial y queremos que
              se sientan cómodos y presentes.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                icon: '💛',
                title: 'Es un encuentro, no una fiesta',
                body: 'No habrá música a alto volumen ni baile prolongado. Es un momento íntimo para compartir, conversar y celebrar juntos de manera tranquila.',
              },
              {
                icon: '📵',
                title: 'Momento sin pantallas (durante la ceremonia)',
                body: 'Durante la ceremonia pedimos que los teléfonos queden guardados. Queremos que todos estén presentes en ese momento tan especial. Habrá tiempo para fotos después.',
              },
              {
                icon: '🍷',
                title: 'Alcohol responsable',
                body: 'Habrá vino y algo de alcohol disponible, pero queremos una celebración consciente. Apreciamos que cada persona tome sus propias decisiones al respecto.',
              },
              {
                icon: '👶',
                title: 'Evento para adultos',
                body: 'Para mantener la atmósfera que buscamos, es un evento solo para adultos. Te pedimos considerar esto al planificar tu asistencia.',
              },
              {
                icon: '🎁',
                title: 'Los regalos no son necesarios',
                body: 'Su presencia es el mejor regalo. Si desean contribuir de alguna manera, en breve compartiremos una lista de deseos para quienes insistan.',
              },
              {
                icon: '⏰',
                title: 'Puntualidad',
                body: 'Te pedimos llegar a tiempo. La ceremonia comenzará a la hora indicada y no queremos interrupciones.',
              },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  background: 'rgba(250,249,247,0.07)',
                  border: '1px solid rgba(196,191,172,0.2)',
                  borderRadius: '4px',
                  padding: '20px 24px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>{item.icon}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 500, color: 'var(--cream)', marginBottom: '6px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--sand)', lineHeight: 1.65, opacity: 0.85 }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer back to RSVP */}
      <section style={{ padding: '48px 24px', background: 'var(--cream)', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '16px', color: 'var(--muted)', marginBottom: '24px' }}>
          ¿Aún no confirmaste tu asistencia?
        </p>
        <Link href="/invitacion" className="btn-primary">
          Confirmar asistencia
        </Link>
      </section>
    </div>
  )
}
