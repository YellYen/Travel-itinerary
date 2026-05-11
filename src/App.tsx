import { useState, useCallback } from 'react'
import type { Trip } from './types'
import { getTrips } from './storage'
import TripList from './components/TripList'
import TripDetail from './components/TripDetail'

export default function App() {
  const [trips, setTrips] = useState<Trip[]>(() => getTrips())
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)

  const refresh = useCallback(() => setTrips(getTrips()), [])

  const selectedTrip = selectedTripId ? trips.find(t => t.id === selectedTripId) ?? null : null

  if (selectedTrip) {
    return (
      <TripDetail
        trip={selectedTrip}
        onBack={() => setSelectedTripId(null)}
        onTripChange={refresh}
      />
    )
  }

  return (
    <TripList
      trips={trips}
      onSelect={trip => setSelectedTripId(trip.id)}
      onTripsChange={refresh}
    />
  )
}
