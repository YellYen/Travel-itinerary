import type { Entry, TravelEntry, StayEntry } from '../types'

interface Props {
  entry: Entry
  isStayBanner?: boolean
  onEdit: () => void
  onDelete: () => void
}

const TYPE_CONFIG = {
  travel: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  stay:   { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  experience: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  place: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
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
    const parts = [t.origin, t.destination].filter(Boolean)
    const label = parts.join(' → ')
    return t.flightNumber ? `${t.flightNumber} · ${label}` : label
  }
  if (entry.type === 'stay') {
    const s = entry as StayEntry
    return s.address ?? null
  }
  if (entry.type === 'experience') return entry.location ?? null
  if (entry.type === 'place') return entry.address ?? null
  return null
}

function timeDisplay(entry: Entry): string | null {
  if (entry.type === 'stay') return null
  if (entry.startTime) {
    return entry.endTime ? `${entry.startTime} – ${entry.endTime}` : entry.startTime
  }
  return null
}

export default function EntryCard({ entry, isStayBanner, onEdit, onDelete }: Props) {
  const cfg = TYPE_CONFIG[entry.type]
  const subtitle = entrySubtitle(entry)
  const time = timeDisplay(entry)

  if (isStayBanner) {
    return (
      <div className={`rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2 flex items-center justify-between group`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">{entryIcon(entry)}</span>
          <span className="text-sm font-medium text-slate-700 truncate">{entry.title}</span>
          {entry.confirmationNumber && (
            <span className="text-xs text-slate-400 truncate hidden sm:block">#{entry.confirmationNumber}</span>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
          <button onClick={onEdit} className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white/70 transition-colors text-xs">✏️</button>
          <button onClick={onDelete} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white/70 transition-colors text-xs">🗑️</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 group`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="text-xl mt-0.5 shrink-0">{entryIcon(entry)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-800 text-sm">{entry.title}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                {entry.type}
              </span>
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
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white/70 transition-colors">✏️</button>
          <button onClick={onDelete} className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-white/70 transition-colors">🗑️</button>
        </div>
      </div>
    </div>
  )
}
