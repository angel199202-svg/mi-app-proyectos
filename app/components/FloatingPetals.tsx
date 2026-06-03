'use client'

const PETALS = [
  { left: '5%',  delay: '0s',   dur: '9s',  size: 14, hue: 0 },
  { left: '14%', delay: '1.3s', dur: '11s', size: 10, hue: 1 },
  { left: '23%', delay: '2.8s', dur: '8s',  size: 16, hue: 0 },
  { left: '34%', delay: '0.5s', dur: '13s', size: 11, hue: 1 },
  { left: '45%', delay: '3.5s', dur: '9s',  size: 13, hue: 0 },
  { left: '55%', delay: '1.8s', dur: '12s', size: 9,  hue: 1 },
  { left: '64%', delay: '4.2s', dur: '10s', size: 15, hue: 0 },
  { left: '73%', delay: '0.9s', dur: '8s',  size: 12, hue: 1 },
  { left: '82%', delay: '2.1s', dur: '11s', size: 10, hue: 0 },
  { left: '91%', delay: '3.0s', dur: '9s',  size: 14, hue: 1 },
  { left: '10%', delay: '5.1s', dur: '10s', size: 11, hue: 0 },
  { left: '88%', delay: '6.3s', dur: '12s', size: 13, hue: 1 },
]

export function FloatingPetals() {
  return (
    <div className="petals-container" aria-hidden="true">
      {PETALS.map((p, i) => (
        <svg
          key={i}
          className="petal"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.dur,
            width: p.size,
            height: p.size * 1.7,
          }}
          viewBox="0 0 20 34"
          fill="none"
        >
          {p.hue === 0 ? (
            <>
              <path d="M10 0 C16 9 16 25 10 34 C4 25 4 9 10 0Z" fill="#d1beb0" opacity="0.6" />
              <path d="M10 5 C13 12 13 22 10 29 C7 22 7 12 10 5Z" fill="#c4bfac" opacity="0.35" />
            </>
          ) : (
            <>
              <path d="M10 0 C16 9 16 25 10 34 C4 25 4 9 10 0Z" fill="#c4bfac" opacity="0.55" />
              <path d="M10 5 C13 12 13 22 10 29 C7 22 7 12 10 5Z" fill="#e5e3e6" opacity="0.3" />
            </>
          )}
        </svg>
      ))}
    </div>
  )
}
