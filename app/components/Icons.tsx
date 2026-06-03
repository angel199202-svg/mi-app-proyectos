type IconProps = {
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

const base = (size: number, color: string, sw: number, children: React.ReactNode, className?: string, style?: React.CSSProperties) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    className={className} style={style} aria-hidden="true">
    {children}
  </svg>
)

export function CalendarIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </>, className, style)
}

export function ClockIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 7 12 12 15 14" />
  </>, className, style)
}

export function PinIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </>, className, style)
}

export function CarIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M5 17H3a1 1 0 01-1-1v-4a1 1 0 01.26-.67L5 8h14l2.74 3.33A1 1 0 0122 12v4a1 1 0 01-1 1h-2" />
    <path d="M5 8l1.5-4h11L19 8" />
    <circle cx="7.5" cy="17" r="2" />
    <circle cx="16.5" cy="17" r="2" />
    <line x1="9.5" y1="17" x2="14.5" y2="17" />
  </>, className, style)
}

export function CameraIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </>, className, style)
}

export function GlobeIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </>, className, style)
}

export function PeopleIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </>, className, style)
}

export function LinkIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </>, className, style)
}

export function EditIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </>, className, style)
}

export function TrashIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </>, className, style)
}

export function StarIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </>, className, style)
}

export function ChatIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </>, className, style)
}

export function HangerIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M12 4a2 2 0 012 2c0 .9-.5 1.7-1.3 2.1L20 14H4l7.3-5.9A2.3 2.3 0 0112 6a2 2 0 012-2" />
    <path d="M4 14v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
  </>, className, style)
}

export function LeafIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M17 8C8 10 5.9 16.17 3.82 22M9.1 4.4C10.4 3.52 12 3 13.8 3 18.34 3 22 6.66 22 11.2 22 16.34 17.35 21 12 21" />
  </>, className, style)
}

export function PhoneOffIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.5 16.5L19 19a2 2 0 01-2.73.73l-3-1.48a2 2 0 01-1-.93l-.65-1.3a10.25 10.25 0 01-4.63-4.63L5.7 7.69a2 2 0 01-.93-1l-1.48-3A2 2 0 014 1H5a10 10 0 0116 8" />
    <path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 0114 20" />
  </>, className, style)
}

export function GiftIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
  </>, className, style)
}

export function CelebrationIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M12 2L13.4 8.6L20 10L13.4 11.4L12 18L10.6 11.4L4 10L10.6 8.6L12 2Z" />
    <line x1="20" y1="4" x2="22" y2="2" />
    <line x1="4" y1="20" x2="2" y2="22" />
    <circle cx="20" cy="20" r="1" fill={color} stroke="none" />
    <circle cx="4" cy="4" r="1" fill={color} stroke="none" />
  </>, className, style)
}

export function HeartEnvelopeIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <path d="M12 16s-6-4.3-6-8a3 3 0 016 0 3 3 0 016 0c0 3.7-6 8-6 8z" />
  </>, className, style)
}

export function CheckIcon({ size = 20, color = 'currentColor', strokeWidth = 2, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <polyline points="20 6 9 17 4 12" />
  </>, className, style)
}

export function WineIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <path d="M8 22h8M12 11v11M6 2l1.5 6A5 5 0 0012 12a5 5 0 004.5-4L18 2z" />
    <line x1="6" y1="7" x2="18" y2="7" />
  </>, className, style)
}

export function NoChildIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <circle cx="12" cy="6" r="3" />
    <path d="M9 20v-5a3 3 0 016 0v5" />
    <line x1="4" y1="4" x2="20" y2="20" />
  </>, className, style)
}

export function DashboardIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </>, className, style)
}

export function PhotosIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <rect x="2" y="6" width="18" height="14" rx="2" />
    <circle cx="8.5" cy="11.5" r="1.5" />
    <path d="M20 15l-5-5L5 20" />
    <path d="M2 2h4v4H2z" />
  </>, className, style)
}

export function CopyIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </>, className, style)
}

export function ParkingIcon({ size = 20, color = 'currentColor', strokeWidth = 1.5, className, style }: IconProps) {
  return base(size, color, strokeWidth, <>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 17V7h4a3 3 0 010 6H9" />
  </>, className, style)
}

export function RingsIcon({ size = 40, color = 'currentColor', strokeWidth = 1.5, className, style }: Omit<IconProps, 'size'> & { size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.6)} viewBox="0 0 40 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" className={className} style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="28" cy="12" r="10" />
    </svg>
  )
}
