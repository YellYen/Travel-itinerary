import type { Trip, Entry } from './types'

const KEY = 'travel_itinerary_trips'

export function getTrips(): Trip[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveTrips(trips: Trip[]): void {
  localStorage.setItem(KEY, JSON.stringify(trips))
}

export function saveTrip(trip: Trip): void {
  const trips = getTrips()
  const idx = trips.findIndex(t => t.id === trip.id)
  if (idx >= 0) trips[idx] = trip
  else trips.push(trip)
  saveTrips(trips)
}

export function deleteTrip(tripId: string): void {
  saveTrips(getTrips().filter(t => t.id !== tripId))
}

export function saveEntry(tripId: string, entry: Entry): void {
  const trips = getTrips()
  const trip = trips.find(t => t.id === tripId)
  if (!trip) return
  const idx = trip.entries.findIndex(e => e.id === entry.id)
  if (idx >= 0) trip.entries[idx] = entry
  else trip.entries.push(entry)
  saveTrips(trips)
}

export function deleteEntry(tripId: string, entryId: string): void {
  const trips = getTrips()
  const trip = trips.find(t => t.id === tripId)
  if (!trip) return
  trip.entries = trip.entries.filter(e => e.id !== entryId)
  saveTrips(trips)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
