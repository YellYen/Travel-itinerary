import { useState, useEffect, useRef } from 'react'
import type { Trip, Entry, StayEntry } from '../types'
import { deleteEntry, saveEntry, deleteTrip } from '../storage'
import { inferTripCurrencies, getCurrencySymbol } from '../currencies'
import DaySection from './DaySection'
import DayNav from './DayNav'
import EntryModal from './EntryModal'
import TripModal from './TripModal'

interface Props {
  trip: Trip
  onBack: () => void
  onTripChange: () => void
}

function eachDay(startDate: string, endDate: string): string[] {
  const days: string[] = []
  const cur = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function staysOnDay(entries: Entry[], day: string): StayEntry[] {
  return entries.filter(
    (e): e is StayEntry => e.type === 'stay' && e.checkIn <= day && e.checkOut > day
  )
}

function staysCheckingOutOnDay(entries: Entry[], day: string): StayEntry[] {
  return entries.filter(
    (e): e is StayEntry => e.type === 'stay' && e.checkOut === day
  )
}

function nonStayEntriesOnDay(entries: Entry[], day: string): Entry[] {
  return entries.filter(e => e.type !== 'stay' && e.date === day)
}

function shortDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function generateIcs(trip: Trip): string {
  const escape = (s: string) => s.replace(/[,;\\]/g, c => `\\${c}`).replace(/\n/g, '\\n')
  const fmtDate = (d: string) => d.replace(/-/g, '')
  const fmtDateTime = (d: string, t?: string) =>
    t ? `${fmtDate(d)}T${t.replace(':', '')}00` : fmtDate(d)

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Travel Itinerary//EN',
    'CALSCALE:GREGORIAN',
  ]

  for (const e of trip.entries) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${e.id}@travel-itinerary`)
    lines.push(`SUMMARY:${escape(e.title)}`)
    if (e.notes) lines.push(`DESCRIPTION:${escape(e.notes)}`)

    if (e.type === 'stay') {
      lines.push(`DTSTART;VALUE=DATE:${fmtDate(e.checkIn)}`)
      lines.push(`DTEND;VALUE=DATE:${fmtDate(e.checkOut)}`)
      if (e.address) lines.push(`LOCATION:${escape(e.address)}`)
    } else {
      lines.push(`DTSTART:${fmtDateTime(e.date, e.startTime)}`)
      lines.push(`DTEND:${fmtDateTime(e.date, e.endTime ?? e.startTime)}`)
    }
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function downloadIcs(trip: Trip) {
  const ics = generateIcs(trip)
  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${trip.name.replace(/\s+/g, '-')}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function totalsByCurrency(entries: Entry[]): { code: string; amount: number }[] {
  const map: Record<string, number> = {}
  for (const e of entries) {
    if (e.cost == null) continue
    const code = e.currency ?? 'USD'
    map[code] = (map[code] ?? 0) + e.cost
  }
  return Object.entries(map).map(([code, amount]) => ({ code, amount }))
}

const LEGEND = [
  { label: 'Travel',     color: 'bg-blue-400' },
  { label: 'Stay',       color: 'bg-purple-400' },
  { label: 'Experience', color: 'bg-orange-400' },
  { label: 'Place',      color: 'bg-green-400' },
]

export default function TripDetail({ trip, onBack, onTripChange }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const days = eachDay(trip.startDate, trip.endDate)
  const todayInTrip = days.includes(today)
  const firstVisibleDay = todayInTrip ? today : days[0]

  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editEntry, setEditEntry] = useState<Entry | null>(null)
  const [addForDate, setAddForDate] = useState<string | null>(null)
  const [showTripModal, setShowTripModal] = useState(false)
  const [activeDay, setActiveDay] = useState(firstVisibleDay)

  const navRef = useRef<HTMLDivElement>(null)
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const isProgrammaticScrollRef = useRef(false)

  // Track which day is at the top as the user scrolls (skipped during programmatic scrolls)
  useEffect(() => {
    function update() {
      if (isProgrammaticScrollRef.current) return
      const navH = navRef.current?.offsetHeight ?? 130
      let found = days[0]
      for (const day of days) {
        const el = dayRefs.current[day]
        if (el && el.getBoundingClientRect().top <= navH + 4) {
          found = day
        } else {
          break
        }
      }
      setActiveDay(found)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [days])

  // Scroll to first visible day on mount
  useEffect(() => {
    const timer = setTimeout(() => scrollToDay(firstVisibleDay), 60)
    return () => clearTimeout(timer)
  }, [])

  function scrollToDay(day: string) {
    const el = dayRefs.current[day]
    if (!el) return
    const navH = navRef.current?.offsetHeight ?? 130
    const y = el.getBoundingClientRect().top + window.scrollY - navH - 8
    isProgrammaticScrollRef.current = true
    setActiveDay(day)
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    setTimeout(() => { isProgrammaticScrollRef.current = false }, 700)
  }

  function handleEditEntry(entry: Entry) {
    setEditEntry(entry)
    setAddForDate(null)
    setShowEntryModal(true)
  }

  function handleEntrySaved(entry: Entry) {
    saveEntry(trip.id, entry)
    setShowEntryModal(false)
    setAddForDate(null)
    onTripChange()
  }

  function handleAddForDay(date: string) {
    setEditEntry(null)
    setAddForDate(date)
    setShowEntryModal(true)
  }

  function handleTripSaved() {
    setShowTripModal(false)
    onTripChange()
  }

  const totals = totalsByCurrency(trip.entries)
  const tripCurrencies = inferTripCurrencies(trip.entries)
  const startD = new Date(trip.startDate + 'T00:00:00')

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Sticky panel ── */}
      <div ref={navRef} className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto">

          {/* Row 1: trip header */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-1 min-w-0">
            <button
              onClick={onBack}
              className="text-slate-400 hover:text-slate-600 transition-colors text-sm shrink-0"
            >
              ← Back
            </button>
            <div className="w-px h-4 bg-slate-200 shrink-0" />
            <h1 className="font-semibold text-slate-800 text-sm truncate flex-1 min-w-0">{trip.name}</h1>
            <button
              onClick={() => setShowTripModal(true)}
              className="text-slate-400 hover:text-blue-600 transition-colors shrink-0 text-sm"
              title="Edit trip"
            >✏️</button>
            <span className="text-xs text-slate-400 shrink-0 hidden sm:block">
              {shortDate(trip.startDate)} – {shortDate(trip.endDate)}
            </span>
            <button
              onClick={() => downloadIcs(trip)}
              title="Export to calendar"
              className="text-slate-400 hover:text-green-600 transition-colors shrink-0 p-0.5"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="2.5" width="14" height="12.5" rx="1.5" />
                <path d="M1 6.5h14" />
                <path d="M5 1v3" />
                <path d="M11 1v3" />
              </svg>
            </button>
          </div>

          {/* Row 2: day strip */}
          <DayNav days={days} activeDay={activeDay} today={today} onSelectDay={scrollToDay} />

          {/* Row 3: legend + totals + add entry */}
          <div className="flex items-center justify-between px-4 pb-2.5 pt-0.5 gap-2">
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap min-w-0">
              {LEGEND.map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                  {label}
                </span>
              ))}
              {totals.length > 0 && (
                <span className="text-slate-600 font-medium shrink-0">
                  · {totals.map(t => `${getCurrencySymbol(t.code)}${t.amount.toLocaleString()}`).join(' · ')}
                </span>
              )}
            </div>
            <button
              onClick={() => { setEditEntry(null); setAddForDate(null); setShowEntryModal(true) }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 shrink-0"
            >
              <span className="text-base leading-none">+</span> Add entry
            </button>
          </div>

        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">

        {/* Trip notes */}
        {trip.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-slate-700 whitespace-pre-wrap">
            {trip.notes}
          </div>
        )}

        {/* Timeline */}
        <div>
          {days.map((day) => {
            const dayNumber = Math.floor(
              (new Date(day + 'T00:00:00').getTime() - startD.getTime()) / 86400000
            ) + 1
            return (
              <div key={day} ref={el => { dayRefs.current[day] = el }}>
                <DaySection
                  date={day}
                  dayNumber={dayNumber}
                  entries={nonStayEntriesOnDay(trip.entries, day)}
                  stayEntries={staysOnDay(trip.entries, day)}
                  checkOutStays={staysCheckingOutOnDay(trip.entries, day)}
                  isToday={day === today}
                  onEdit={handleEditEntry}
                  onAdd={() => handleAddForDay(day)}
                />
              </div>
            )
          })}
        </div>

        {trip.entries.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-base">No entries yet — add your first!</p>
          </div>
        )}
      </div>

      {showEntryModal && (
        <EntryModal
          tripStartDate={trip.startDate}
          tripEndDate={trip.endDate}
          existing={editEntry}
          defaultDate={addForDate ?? undefined}
          availableCurrencies={tripCurrencies}
          onClose={() => { setShowEntryModal(false); setAddForDate(null) }}
          onSaved={handleEntrySaved}
          onDelete={editEntry ? () => {
            if (!confirm(`Delete "${editEntry.title}"?`)) return
            deleteEntry(trip.id, editEntry.id)
            setShowEntryModal(false)
            onTripChange()
          } : undefined}
        />
      )}

      {showTripModal && (
        <TripModal
          existing={trip}
          onClose={() => setShowTripModal(false)}
          onSaved={handleTripSaved}
          onDelete={() => {
            if (!confirm(`Delete "${trip.name}"? All entries will be lost.`)) return
            deleteTrip(trip.id)
            onBack()
          }}
        />
      )}
    </div>
  )
}
