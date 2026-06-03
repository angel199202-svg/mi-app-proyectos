'use client'

type Particle =
  | { type: 'petal'; left: string; delay: string; dur: string; w: number; h: number; opacity: number }
  | { type: 'sparkle'; left: string; delay: string; dur: string; size: number }
  | { type: 'leaf'; left: string; delay: string; dur: string; w: number; h: number }

const PARTICLES: Particle[] = [
  /* ── Petals (rose / sand tones) ── */
  { type: 'petal', left: '4%',  delay: '0s',    dur: '11s', w: 14, h: 22, opacity: 0.75 },
  { type: 'petal', left: '12%', delay: '2.4s',  dur: '13s', w: 10, h: 17, opacity: 0.60 },
  { type: 'petal', left: '22%', delay: '0.8s',  dur: '9s',  w: 16, h: 26, opacity: 0.70 },
  { type: 'petal', left: '33%', delay: '4.1s',  dur: '12s', w: 11, h: 18, opacity: 0.55 },
  { type: 'petal', left: '44%', delay: '1.5s',  dur: '10s', w: 13, h: 21, opacity: 0.65 },
  { type: 'petal', left: '55%', delay: '3.3s',  dur: '14s', w: 9,  h: 15, opacity: 0.60 },
  { type: 'petal', left: '66%', delay: '0.3s',  dur: '11s', w: 15, h: 24, opacity: 0.72 },
  { type: 'petal', left: '76%', delay: '2.9s',  dur: '9s',  w: 12, h: 20, opacity: 0.58 },
  { type: 'petal', left: '85%', delay: '1.1s',  dur: '13s', w: 10, h: 17, opacity: 0.65 },
  { type: 'petal', left: '93%', delay: '4.7s',  dur: '10s', w: 14, h: 23, opacity: 0.62 },
  { type: 'petal', left: '8%',  delay: '6.2s',  dur: '12s', w: 11, h: 18, opacity: 0.55 },
  { type: 'petal', left: '50%', delay: '5.0s',  dur: '11s', w: 13, h: 21, opacity: 0.68 },

  /* ── Sparkles (cream / gold tones, twinkling) ── */
  { type: 'sparkle', left: '7%',  delay: '1.0s',  dur: '6s',  size: 12 },
  { type: 'sparkle', left: '18%', delay: '3.6s',  dur: '7s',  size: 9  },
  { type: 'sparkle', left: '28%', delay: '0.4s',  dur: '5s',  size: 14 },
  { type: 'sparkle', left: '40%', delay: '2.2s',  dur: '8s',  size: 10 },
  { type: 'sparkle', left: '52%', delay: '4.8s',  dur: '6s',  size: 13 },
  { type: 'sparkle', left: '61%', delay: '1.7s',  dur: '7s',  size: 11 },
  { type: 'sparkle', left: '72%', delay: '3.1s',  dur: '5s',  size: 15 },
  { type: 'sparkle', left: '80%', delay: '0.6s',  dur: '8s',  size: 8  },
  { type: 'sparkle', left: '89%', delay: '5.5s',  dur: '6s',  size: 12 },
  { type: 'sparkle', left: '96%', delay: '2.0s',  dur: '7s',  size: 10 },

  /* ── Leaves (olive, gentle drift) ── */
  { type: 'leaf', left: '15%', delay: '1.8s',  dur: '15s', w: 9,  h: 13 },
  { type: 'leaf', left: '37%', delay: '3.9s',  dur: '13s', w: 11, h: 16 },
  { type: 'leaf', left: '59%', delay: '0.9s',  dur: '16s', w: 8,  h: 12 },
  { type: 'leaf', left: '78%', delay: '5.3s',  dur: '14s', w: 10, h: 15 },
  { type: 'leaf', left: '91%', delay: '2.6s',  dur: '15s', w: 9,  h: 13 },
  { type: 'leaf', left: '3%',  delay: '7.1s',  dur: '13s', w: 10, h: 14 },
]

/* ── SVG shapes ─────────────────────────────────────────── */

function PetalSvg({ w, h, opacity }: { w: number; h: number; opacity: number }) {
  const isSecondary = opacity < 0.65
  const fill = isSecondary ? '#c4bfac' : '#d1beb0'
  const inner = isSecondary ? '#e5e3e6' : '#c4bfac'
  return (
    <svg width={w} height={h} viewBox="0 0 20 32" fill="none" aria-hidden="true">
      <path d="M10 0 C16 8 16 24 10 32 C4 24 4 8 10 0Z" fill={fill} opacity={opacity} />
      <path d="M10 4 C13 10 13 22 10 28 C7 22 7 10 10 4Z" fill={inner} opacity="0.4" />
    </svg>
  )
}

function SparkleSvg({ size }: { size: number }) {
  const isLarge = size >= 12
  const fill = isLarge ? '#faf9f7' : '#d1beb0'
  const glow = isLarge ? '#e5e3e6' : '#c4bfac'
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {/* Outer glow ring */}
      <circle cx="10" cy="10" r="7" fill={glow} opacity="0.18" />
      {/* 4-pointed star */}
      <path
        d="M10 1 L11.4 8.6 L19 10 L11.4 11.4 L10 19 L8.6 11.4 L1 10 L8.6 8.6 Z"
        fill={fill}
        opacity="0.92"
      />
      {/* Center dot */}
      <circle cx="10" cy="10" r="1.5" fill={fill} opacity="0.7" />
    </svg>
  )
}

function LeafSvg({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox="0 0 16 24" fill="none" aria-hidden="true">
      <path
        d="M8 0 C13 5 14 14 8 24 C2 14 3 5 8 0Z"
        fill="#6a6b4b"
        opacity="0.38"
      />
      <path
        d="M8 4 C10 8 10 16 8 22 C6 16 6 8 8 4Z"
        fill="#6a6b4b"
        opacity="0.2"
      />
      <line x1="8" y1="2" x2="8" y2="22" stroke="#6a6b4b" strokeWidth="0.5" opacity="0.3" />
    </svg>
  )
}

/* ── Component ───────────────────────────────────────────── */
export function FloatingPetals() {
  return (
    <div className="petals-container" aria-hidden="true">
      {PARTICLES.map((p, i) => {
        const sharedStyle: React.CSSProperties = {
          left: p.left,
          animationDelay: p.delay,
          animationDuration: p.dur,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
        }

        if (p.type === 'petal') {
          return (
            <div key={i} className="petal petal-anim" style={sharedStyle}>
              <PetalSvg w={p.w} h={p.h} opacity={p.opacity} />
            </div>
          )
        }

        if (p.type === 'sparkle') {
          return (
            <div key={i} className="petal sparkle-anim" style={sharedStyle}>
              <SparkleSvg size={p.size} />
            </div>
          )
        }

        return (
          <div key={i} className="petal leaf-anim" style={sharedStyle}>
            <LeafSvg w={p.w} h={p.h} />
          </div>
        )
      })}
    </div>
  )
}
