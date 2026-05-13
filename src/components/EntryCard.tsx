import type { Entry, TravelEntry, StayEntry } from '../types'

interface Props {
  entry: Entry
  isStayBanner?: boolean
  currency?: string
  onEdit: () => void
}

const TYPE_CONFIG = {
  travel:     { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  stay:       { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  experience: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  place:      { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700' },
}

const TRAVEL_MODE_ICON: Record<string, string> = {
  flight: '✈️', train: '🚆', bus: '🚌', ferry: '⛴️', other: '🚗',
}

const STAY_TYPE_ICON: Record<string, string> = {
  hotel: '🏨', hostel: '🛏️', airbnb: '🏠', other: '🏡',
}

function entryIcon(entry: Entry): string {
  if (entry.type === 'travel') return TRAVEL_MODE_ICON[(entry as TravelEntry).mode] ?? '🚗'
  if (entry.type === 'stay') return STAY_TYPE_ICON[(entry as StayEntry).accommodationType] ?? '🏨'
  if (entry.type === 'experience') return '🎭'
  return '📍'
}

function entrySubtitle(entry: Entry): string | null {
  if (entry.type === 'travel') {
    const t = entry as TravelEntry
    const label = [t.origin, t.destination].filter(Boolean).join(' → ')
    return t.flightNumber ? `${t.flightNumber} · ${label}` : label
  }
  if (entry.type === 'stay') return (entry as StayEntry).address ?? null
  if (entry.type === 'experience') return entry.location ?? null
  if (entry.type === 'place') return entry.address ?? null
  return null
}

function fmt12h(t: string): string {
  const [hStr, mStr] = t.split(':')
  let h = parseInt(hStr)
  const m = parseInt(mStr)
  const suffix = h >= 12 ? 'PM' : 'AM'
  if (h > 12) h -= 12
  if (h === 0) h = 12
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`
}

function timeDisplay(entry: Entry): string | null {
  if (entry.type === 'stay') return null
  if (entry.startTime) {
    const start = fmt12h(entry.startTime)
    return entry.endTime ? `${start} – ${fmt12h(entry.endTime)}` : start
  }
  return null
}

function sentenceCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function EntryCard({ entry, isStayBanner, currency, onEdit }: Props) {
  const cfg = TYPE_CONFIG[entry.type]
  const subtitle = entrySubtitle(entry)
  const time = timeDisplay(entry)

  const costLabel = entry.cost != null
    ? `${currency ?? ''}${entry.cost.toLocaleString()}`
    : null

  if (isStayBanner) {
    return (
      <div
        onClick={onEdit}
        className={`rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2 flex items-center justify-between cursor-pointer active:opacity-80`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{entryIcon(entry)}</span>
          <span className="text-sm font-medium text-slate-700 truncate">{entry.title}</span>
          {entry.confirmationNumber && (
            <span className="text-xs text-slate-400 truncate hidden sm:block">#{entry.confirmationNumber}</span>
          )}
        </div>
        <div className="flex items-center gap-2 ml-2 shrink-0">
          {costLabel && <span className="text-xs text-slate-500 font-medium">{costLabel}</span>}
          {entry.bookingUrl && (
            <a
              href={entry.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-slate-400 hover:text-blue-600 transition-colors"
              title="Open booking link"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" />
                <path d="M8 1h4v4" />
                <path d="M12 1L5.5 7.5" />
              </svg>
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onEdit}
      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 cursor-pointer active:opacity-80`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="text-xl mt-0.5 shrink-0">{entryIcon(entry)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-800 text-sm">{entry.title}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.badge}`}>
              {sentenceCase(entry.type)}
            </span>
            {costLabel && (
              <span className="text-xs text-slate-500 font-medium">{costLabel}</span>
            )}
            {entry.bookingUrl && (
              <a
                href={entry.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-slate-400 hover:text-blue-600 transition-colors text-sm"
                title="Open booking link"
              >🔗</a>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {time && <span className="text-xs text-slate-500 font-mono">{time}</span>}
            {entry.confirmationNumber && (
              <span className="text-xs text-slate-400">#{entry.confirmationNumber}</span>
            )}
          </div>
          {entry.notes && (
            <p className="text-xs text-slate-500 mt-1.5 bg-white/60 rounded px-2 py-1 border border-white/80">{entry.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}
