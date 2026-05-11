import { useState } from 'react'
import type { Trip, Entry, StayEntry } from '../types'
import { deleteEntry, saveEntry } from '../storage'
import DaySection from './DaySection'
import EntryModal from './EntryModal'

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
    (e): e is StayEntry =>
      e.type === 'stay' && e.checkIn <= day && e.checkOut > day
  )
}

function nonStayEntriesOnDay(entries: Entry[], day: string): Entry[] {
  return entries.filter(e => e.type !== 'stay' && e.date === day)
}

export default function TripDetail({ trip, onBack, onTripChange }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState<Entry | null>(null)

  const days = eachDay(trip.startDate, trip.endDate)

  function handleDelete(entry: Entry) {
    if (!confirm(`Delete "${entry.title}"?`)) return
    deleteEntry(trip.id, entry.id)
    onTripChange()
  }

  function handleEdit(entry: Entry) {
    setEditEntry(entry)
    setShowModal(true)
  }

  function handleSaved(entry: Entry) {
    saveEntry(trip.id, entry)
    setShowModal(false)
    onTripChange()
  }

  const startD = new Date(trip.startDate + 'T00:00:00')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <button
              onClick={onBack}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors mb-2 flex items-center gap-1"
            >
              ← All trips
            </button>
            <h1 className="text-2xl font-bold text-slate-800">{trip.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {new Date(trip.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              {' – '}
              {new Date(trip.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => { setEditEntry(null); setShowModal(true) }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
          >
            <span className="text-base leading-none">+</span> Add entry
          </button>
        </div>

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
              <DaySection
                key={day}
                date={day}
                dayNumber={dayNumber}
                entries={nonStayEntriesOnDay(trip.entries, day)}
                stayEntries={staysOnDay(trip.entries, day)}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )
          })}
        </div>

        {trip.entries.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-base">No entries yet — add your first!</p>
          </div>
        )}
      </div>

      {showModal && (
        <EntryModal
          tripStartDate={trip.startDate}
          tripEndDate={trip.endDate}
          existing={editEntry}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
