import type { Entry, StayEntry } from '../types'
import EntryCard from './EntryCard'

interface Props {
  date: string        // YYYY-MM-DD
  dayNumber: number
  entries: Entry[]    // timed/non-stay entries for this day
  stayEntries: StayEntry[]  // stays that cover this day
  onEdit: (entry: Entry) => void
  onDelete: (entry: Entry) => void
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

export default function DaySection({ date, dayNumber, entries, stayEntries, onEdit, onDelete }: Props) {
  const sorted = sortEntries(entries)
  const hasContent = sorted.length > 0 || stayEntries.length > 0

  return (
    <div className="relative">
      {/* Day header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-2 h-2 rounded-full bg-slate-300 shrink-0 ml-1" />
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
          {formatDayHeader(date, dayNumber)}
        </h3>
      </div>

      <div className="ml-5 pl-4 border-l-2 border-slate-100 pb-6 space-y-2">
        {/* Stay banners */}
        {stayEntries.map(stay => (
          <EntryCard
            key={stay.id}
            entry={stay}
            isStayBanner
            onEdit={() => onEdit(stay)}
            onDelete={() => onDelete(stay)}
          />
        ))}

        {/* Timed and other entries */}
        {sorted.map(entry => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={() => onEdit(entry)}
            onDelete={() => onDelete(entry)}
          />
        ))}

        {!hasContent && (
          <p className="text-xs text-slate-300 italic py-1">No entries for this day</p>
        )}
      </div>
    </div>
  )
}
