import { useState, useEffect, useRef } from 'react'
import type { Trip, Entry, StayEntry } from '../types'
import { deleteEntry, saveEntry, deleteTrip } from '../storage'
import DaySection from './DaySection'
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

function totalCost(trip: Trip): number | null {
  const costs = trip.entries.map(e => e.cost).filter((c): c is number => c != null)
  return costs.length > 0 ? costs.reduce((a, b) => a + b, 0) : null
}

export default function TripDetail({ trip, onBack, onTripChange }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const days = eachDay(trip.startDate, trip.endDate)

  const todayInTrip = days.includes(today)
  const firstVisibleDay = todayInTrip ? today : days[0]

  const [showEntryModal, setShowEntryModal] = useState(false)
  const [editEntry, setEditEntry] = useState<Entry | null>(null)
  const [addForDate, setAddForDate] = useState<string | null>(null)
  const [showTripModal, setShowTripModal] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {}
    for (const d of days) state[d] = d < today
    return state
  })

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const el = dayRefs.current[firstVisibleDay]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [firstVisibleDay])

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

  const cost = totalCost(trip)
  const currency = trip.currency ?? ''
  const startD = new Date(trip.startDate + 'T00:00:00')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0 mr-3">
            <button onClick={onBack}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors mb-2 flex items-center gap-1">
              ← All trips
            </button>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800 truncate">{trip.name}</h1>
              <button onClick={() => setShowTripModal(true)}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1 shrink-0" title="Edit trip">✏️</button>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date(trip.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              {' – '}
              {new Date(trip.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {cost != null && (
                <span className="ml-3 font-medium text-slate-700">{currency}{cost.toLocaleString()} total</span>
              )}
            </p>
            <button
              onClick={() => downloadIcs(trip)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs border border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-600 px-2.5 py-1 rounded-lg transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="0.75" y="1.75" width="10.5" height="9.5" rx="1.25" />
                <path d="M0.75 5h10.5" />
                <path d="M3.5 0.75v2" />
                <path d="M8.5 0.75v2" />
              </svg>
              Export to calendar
            </button>
          </div>
          <button
            onClick={() => { setEditEntry(null); setAddForDate(null); setShowEntryModal(true) }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span className="text-base leading-none">+</span> Add entry
          </button>
        </div>

        {/* Trip notes */}
        {trip.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-slate-700 whitespace-pre-wrap">
            {trip.notes}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6 text-xs text-slate-500">
          {[
            { label: 'Travel', color: 'bg-blue-400' },
            { label: 'Stay', color: 'bg-purple-400' },
            { label: 'Experience', color: 'bg-orange-400' },
            { label: 'Place', color: 'bg-green-400' },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>

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
                  currency={currency}
                  isToday={day === today}
                  isCollapsed={collapsed[day] ?? false}
                  onEdit={handleEditEntry}
                  onAdd={() => handleAddForDay(day)}
                  onToggleCollapse={() => setCollapsed(c => ({ ...c, [day]: !c[day] }))}
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
