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

export function seedIfEmpty(): void {
  if (getTrips().length > 0) return

  const SAMPLE: Trip = {
    id: 'sample-trip-001',
    name: 'Japan Spring Adventure',
    startDate: '2026-06-01',
    endDate: '2026-06-05',
    entries: [
      // Stays
      {
        id: 's-stay-1',
        type: 'stay',
        title: 'Shinjuku Granbell Hotel',
        date: '2026-06-01',
        accommodationType: 'hotel',
        address: '16-12 Kabukicho, Shinjuku, Tokyo',
        checkIn: '2026-06-01',
        checkOut: '2026-06-03',
        confirmationNumber: 'SGH-2026-04521',
      },
      {
        id: 's-stay-2',
        type: 'stay',
        title: 'Kyoto Machiya Inn',
        date: '2026-06-03',
        accommodationType: 'airbnb',
        address: '15 Gion, Higashiyama, Kyoto',
        checkIn: '2026-06-03',
        checkOut: '2026-06-05',
      },
      // Day 1 — Jun 1
      {
        id: 's-flight-1',
        type: 'travel',
        title: 'London Heathrow → Tokyo Narita',
        date: '2026-06-01',
        mode: 'flight',
        flightNumber: 'JL402',
        origin: 'London Heathrow (LHR)',
        destination: 'Tokyo Narita (NRT)',
        startTime: '11:00',
        confirmationNumber: 'JL-9XK2T',
      },
      {
        id: 's-place-1',
        type: 'place',
        title: 'Senso-ji Temple',
        date: '2026-06-01',
        address: '2 Chome-3-1 Asakusa, Taito, Tokyo',
        startTime: '19:00',
      },
      // Day 2 — Jun 2
      {
        id: 's-exp-1',
        type: 'experience',
        title: 'Tsukiji Outer Market Breakfast',
        date: '2026-06-02',
        location: 'Tsukiji, Tokyo',
        startTime: '08:00',
        endTime: '09:30',
      },
      {
        id: 's-place-2',
        type: 'place',
        title: 'Meiji Shrine',
        date: '2026-06-02',
        address: '1-1 Yoyogikamizonocho, Shibuya, Tokyo',
        startTime: '11:00',
      },
      {
        id: 's-train-1',
        type: 'travel',
        title: 'Tokyo → Kyoto',
        date: '2026-06-02',
        mode: 'train',
        flightNumber: 'Nozomi 25',
        origin: 'Tokyo (Shinjuku)',
        destination: 'Kyoto',
        startTime: '14:00',
        endTime: '16:15',
        confirmationNumber: 'JR-NOZOMI-25',
      },
      // Day 3 — Jun 3
      {
        id: 's-exp-2',
        type: 'experience',
        title: 'Traditional Tea Ceremony',
        date: '2026-06-03',
        location: 'Uji, Kyoto',
        startTime: '10:00',
        endTime: '11:30',
        confirmationNumber: 'TC-88721',
      },
      {
        id: 's-place-3',
        type: 'place',
        title: 'Fushimi Inari Shrine',
        date: '2026-06-03',
        address: '68 Fukakusa Yabunouchicho, Fushimi, Kyoto',
        startTime: '14:00',
      },
      // Day 4 — Jun 4
      {
        id: 's-bus-1',
        type: 'travel',
        title: 'Kyoto → Osaka',
        date: '2026-06-04',
        mode: 'bus',
        origin: 'Kyoto Station',
        destination: 'Osaka Namba',
        startTime: '09:30',
        endTime: '10:45',
      },
      {
        id: 's-exp-3',
        type: 'experience',
        title: 'Takoyaki Cooking Class',
        date: '2026-06-04',
        location: 'Dotonbori, Osaka',
        startTime: '13:00',
        endTime: '15:00',
        confirmationNumber: 'OSK-COOK-512',
      },
      {
        id: 's-ferry-1',
        type: 'travel',
        title: 'Osaka → Hiroshima',
        date: '2026-06-04',
        mode: 'ferry',
        origin: 'Osaka Port',
        destination: 'Hiroshima Port',
        startTime: '17:00',
        endTime: '20:30',
        confirmationNumber: 'FERRY-2026-HRJ',
      },
      // Day 5 — Jun 5
      {
        id: 's-place-4',
        type: 'place',
        title: 'Peace Memorial Park',
        date: '2026-06-05',
        address: '1-2 Nakajimacho, Naka Ward, Hiroshima',
        startTime: '09:00',
      },
      {
        id: 's-other-1',
        type: 'travel',
        title: 'Hiroshima → Osaka Airport',
        date: '2026-06-05',
        mode: 'other',
        origin: 'Hiroshima City',
        destination: 'Osaka Kansai Airport (KIX)',
        startTime: '14:00',
        endTime: '16:30',
      },
    ],
  }

  saveTrips([SAMPLE])
}
