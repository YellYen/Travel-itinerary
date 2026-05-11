import { useState } from 'react'
import type { Trip } from '../types'
import { deleteTrip } from '../storage'
import TripModal from './TripModal'

interface Props {
  trips: Trip[]
  onSelect: (trip: Trip) => void
  onTripsChange: () => void
}

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

function nightCount(start: string, end: string) {
  const diff = (new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime()) / 86400000
  return Math.max(0, diff)
}

export default function TripList({ trips, onSelect, onTripsChange }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editTrip, setEditTrip] = useState<Trip | null>(null)

  function handleDelete(e: React.MouseEvent, trip: Trip) {
    e.stopPropagation()
    if (confirm(`Delete "${trip.name}"? This cannot be undone.`)) {
      deleteTrip(trip.id)
      onTripsChange()
    }
  }

  function handleEdit(e: React.MouseEvent, trip: Trip) {
    e.stopPropagation()
    setEditTrip(trip)
    setShowModal(true)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My Trips</h1>
            <p className="text-slate-500 mt-1">Plan and view your travel itineraries</p>
          </div>
          <button
            onClick={() => { setEditTrip(null); setShowModal(true) }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <div className="text-6xl mb-4">✈️</div>
            <p className="text-lg font-medium">No trips yet</p>
            <p className="text-sm mt-1">Create your first trip to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map(trip => (
              <div
                key={trip.id}
                onClick={() => onSelect(trip)}
                className="bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      {trip.name}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">{formatDateRange(trip.startDate, trip.endDate)}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{nightCount(trip.startDate, trip.endDate)} nights</span>
                      <span>·</span>
                      <span>{trip.entries.length} {trip.entries.length === 1 ? 'entry' : 'entries'}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-3 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => handleEdit(e, trip)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit trip"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={e => handleDelete(e, trip)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete trip"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TripModal
          existing={editTrip}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); onTripsChange() }}
        />
      )}
    </div>
  )
}
