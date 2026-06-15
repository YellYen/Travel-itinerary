import type { Entry, StayEntry } from '../types'
import EntryCard from './EntryCard'

interface Props {
  date: string
  dayNumber: number
  entries: Entry[]
  stayEntries: StayEntry[]
  checkOutStays: StayEntry[]
  isToday?: boolean
  onEdit: (entry: Entry) => void
  onAdd: () => void
}

function formatDayHeader(date: string, dayNumber: number): string {
  const d = new Date(date + 'T00:00:00')
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `Day ${dayNumber} · ${weekday} ${dateStr}`
}

function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
    if (a.startTime) return -1
    if (b.startTime) return 1
    return 0
  })
}

export default function DaySection({
  date, dayNumber, entries, stayEntries, checkOutStays,
  isToday, onEdit, onAdd,
}: Props) {
  const sorted = sortEntries(entries)
  const checkIns = stayEntries.filter(s => s.checkIn === date)
  const hasContent = sorted.length > 0 || stayEntries.length > 0 || checkOutStays.length > 0

  return (
    <div className="relative">
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ml-1 ${isToday ? 'bg-blue-500' : 'bg-slate-300'}`} />
          <h3 className={`text-sm font-semibold uppercase tracking-wide ${isToday ? 'text-blue-600' : 'text-slate-500'}`}>
            {formatDayHeader(date, dayNumber)}
          </h3>
          {isToday && (
            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium normal-case tracking-normal">
              Today
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50 shrink-0"
          title="Add entry for this day"
        >
          <span className="text-base leading-none">+</span>
        </button>
      </div>

      <div className="ml-5 pl-4 border-l-2 border-slate-100 pb-6 space-y-2">
        {/* Check-out chips */}
        {checkOutStays.map(stay => (
          <div
            key={`checkout-${stay.id}`}
            onClick={() => onEdit(stay)}
            className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 flex items-center gap-2 cursor-pointer active:opacity-80"
          >
            <span className="text-base">🚪</span>
            <span className="text-sm text-purple-700 font-medium">Check out</span>
            <span className="text-sm text-slate-600 truncate">· {stay.title}</span>
          </div>
        ))}

        {/* Stay banners */}
        {stayEntries.map(stay => (
          <EntryCard key={stay.id} entry={stay} isStayBanner onEdit={() => onEdit(stay)} />
        ))}

        {/* Check-in chips */}
        {checkIns.map(stay => (
          <div
            key={`checkin-${stay.id}`}
            onClick={() => onEdit(stay)}
            className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 flex items-center gap-2 cursor-pointer active:opacity-80"
          >
            <span className="text-base">🔑</span>
            <span className="text-sm text-purple-700 font-medium">Check in</span>
            <span className="text-sm text-slate-600 truncate">· {stay.title}</span>
          </div>
        ))}

        {/* Timed and other entries */}
        {sorted.map(entry => (
          <EntryCard key={entry.id} entry={entry} onEdit={() => onEdit(entry)} />
        ))}

        {!hasContent && (
          <p className="text-xs text-slate-300 italic py-1">No entries for this day</p>
        )}
      </div>
    </div>
  )
}
