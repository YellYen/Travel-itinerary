export type TravelMode = 'flight' | 'train' | 'bus' | 'ferry' | 'other'
export type AccommodationType = 'hotel' | 'hostel' | 'airbnb' | 'other'
export type EntryType = 'travel' | 'stay' | 'experience' | 'place'

interface BaseEntry {
  id: string
  type: EntryType
  title: string
  date: string         // YYYY-MM-DD
  startTime?: string   // HH:MM local time
  endTime?: string     // HH:MM local time
  confirmationNumber?: string
  notes?: string
}

export interface TravelEntry extends BaseEntry {
  type: 'travel'
  mode: TravelMode
  flightNumber?: string
  origin: string
  destination: string
}

export interface StayEntry extends BaseEntry {
  type: 'stay'
  accommodationType: AccommodationType
  address?: string
  checkIn: string   // YYYY-MM-DD
  checkOut: string  // YYYY-MM-DD
}

export interface ExperienceEntry extends BaseEntry {
  type: 'experience'
  location?: string
}

export interface PlaceEntry extends BaseEntry {
  type: 'place'
  address?: string
}

export type Entry = TravelEntry | StayEntry | ExperienceEntry | PlaceEntry

export interface Trip {
  id: string
  name: string
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  entries: Entry[]
}
