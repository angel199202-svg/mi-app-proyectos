// Re-exports from lucide-react with the names used throughout the app
export {
  Calendar   as CalendarIcon,
  Clock      as ClockIcon,
  MapPin     as PinIcon,
  Car        as CarIcon,
  Camera     as CameraIcon,
  Globe      as GlobeIcon,
  Users      as PeopleIcon,
  Link       as LinkIcon,
  Pencil     as EditIcon,
  Trash2     as TrashIcon,
  Star       as StarIcon,
  MessageSquare as ChatIcon,
  Shirt      as HangerIcon,
  Leaf       as LeafIcon,
  PhoneOff   as PhoneOffIcon,
  Wine       as WineIcon,
  Gift       as GiftIcon,
  Sparkles   as CelebrationIcon,
  Check      as CheckIcon,
  LayoutDashboard as DashboardIcon,
  Images     as PhotosIcon,
  Copy       as CopyIcon,
  SquareParking as ParkingIcon,
  UserX      as NoChildIcon,
  Heart      as HeartEnvelopeIcon,
  PartyPopper as AttendingIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// Custom: wedding rings divider (lucide has no rings icon)
export function RingsIcon({
  size = 40,
  color = 'currentColor',
  strokeWidth = 1.5,
  style,
  className,
}: {
  size?: number
  color?: string
  strokeWidth?: number
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.6)}
      viewBox="0 0 40 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="28" cy="12" r="10" />
    </svg>
  )
}
