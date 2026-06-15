import { useState } from 'react'
import type { Entry, EntryType, TravelEntry, StayEntry, ExperienceEntry, PlaceEntry, TravelMode, AccommodationType } from '../types'
import { generateId } from '../storage'
import { CURRENCIES, getCurrencyByCode } from '../currencies'

interface Props {
  tripStartDate: string
  tripEndDate: string
  existing: Entry | null
  defaultDate?: string
  availableCurrencies: string[]
  onClose: () => void
  onSaved: (entry: Entry) => void
  onDelete?: () => void
}

const ENTRY_TYPES: { value: EntryType; label: string; icon: string }[] = [
  { value: 'travel',     label: 'Travel',     icon: '✈️' },
  { value: 'stay',       label: 'Stay',       icon: '🏨' },
  { value: 'experience', label: 'Experience', icon: '🎭' },
  { value: 'place',      label: 'Place',      icon: '📍' },
]

const TRAVEL_MODES: { value: TravelMode; label: string; icon: string }[] = [
  { value: 'flight', label: 'Flight',  icon: '✈️' },
  { value: 'train',  label: 'Train',   icon: '🚆' },
  { value: 'bus',    label: 'Bus',     icon: '🚌' },
  { value: 'ferry',  label: 'Ferry',   icon: '⛴️' },
  { value: 'other',  label: 'Other',   icon: '🚗' },
]

const ACCOMMODATION_TYPES: { value: AccommodationType; label: string }[] = [
  { value: 'hotel',  label: 'Hotel' },
  { value: 'hostel', label: 'Hostel' },
  { value: 'airbnb', label: 'Airbnb' },
  { value: 'other',  label: 'Other' },
]

function inputClass(extra = '') {
  return `w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${extra}`
}

function labelClass() {
  return 'block text-sm font-medium text-slate-700 mb-1'
}

function parseTo24h(raw: string): string | null {
  const s = raw.trim()
  if (!s) return null

  const plain = s.match(/^(\d{1,2}):(\d{2})$/)
  if (plain) {
    const h = parseInt(plain[1]), m = parseInt(plain[2])
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  const twelve = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i)
  if (twelve) {
    let h = parseInt(twelve[1])
    const m = parseInt(twelve[2] ?? '0')
    const meridiem = twelve[3].toLowerCase()
    if (h < 1 || h > 12 || m < 0 || m > 59) return null
    if (meridiem === 'am' && h === 12) h = 0
    if (meridiem === 'pm' && h !== 12) h += 12
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  return null
}

export default function EntryModal({ tripStartDate, tripEndDate, existing, defaultDate, availableCurrencies, onClose, onSaved, onDelete }: Props) {
  const [type, setType] = useState<EntryType>(existing?.type ?? 'travel')
  const [title, setTitle] = useState(existing?.title ?? '')
  const [date, setDate] = useState(existing?.date ?? defaultDate ?? tripStartDate)
  const [startTime, setStartTime] = useState(existing?.startTime ?? '')
  const [endTime, setEndTime] = useState(existing?.endTime ?? '')
  const [confirmation, setConfirmation] = useState(existing?.confirmationNumber ?? '')
  const [cost, setCost] = useState(existing?.cost != null ? String(existing.cost) : '')
  const [currency, setCurrency] = useState(existing?.currency ?? availableCurrencies[0] ?? 'USD')
  const [bookingUrl, setBookingUrl] = useState(existing?.bookingUrl ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [error, setError] = useState('')

  // Travel fields
  const travelExisting = existing?.type === 'travel' ? existing as TravelEntry : null
  const [travelMode, setTravelMode] = useState<TravelMode>(travelExisting?.mode ?? 'flight')
  const [flightNumber, setFlightNumber] = useState(travelExisting?.flightNumber ?? '')
  const [origin, setOrigin] = useState(travelExisting?.origin ?? '')
  const [destination, setDestination] = useState(travelExisting?.destination ?? '')

  // Stay fields
  const stayExisting = existing?.type === 'stay' ? existing as StayEntry : null
  const [accommodationType, setAccommodationType] = useState<AccommodationType>(stayExisting?.accommodationType ?? 'hotel')
  const [address, setAddress] = useState(stayExisting?.address ?? '')
  const [checkIn, setCheckIn] = useState(stayExisting?.checkIn ?? tripStartDate)
  const [checkOut, setCheckOut] = useState(stayExisting?.checkOut ?? tripEndDate)

  // Experience fields
  const expExisting = existing?.type === 'experience' ? existing as ExperienceEntry : null
  const [expLocation, setExpLocation] = useState(expExisting?.location ?? '')

  // Place fields
  const placeExisting = existing?.type === 'place' ? existing as PlaceEntry : null
  const [placeAddress, setPlaceAddress] = useState(placeExisting?.address ?? '')

  function buildEntry(): Entry | null {
    if (type !== 'travel' && !title.trim()) { setError('Title is required'); return null }

    const parsedStart = startTime ? parseTo24h(startTime) : null
    const parsedEnd = endTime ? parseTo24h(endTime) : null
    if (startTime && !parsedStart) { setError('Invalid start time — try "9:00 AM" or "14:30"'); return null }
    if (endTime && !parsedEnd) { setError('Invalid end time — try "9:00 AM" or "14:30"'); return null }

    const costVal = cost.trim() ? parseFloat(cost.trim()) : undefined
    if (cost.trim() && (isNaN(costVal!) || costVal! < 0)) { setError('Cost must be a positive number'); return null }

    if (type === 'travel') {
      if (!origin.trim() || !destination.trim()) { setError('Origin and destination are required'); return null }
      const base = {
        id: existing?.id ?? generateId(),
        title: `${origin.trim()} → ${destination.trim()}`,
        date,
        startTime: parsedStart ?? undefined,
        endTime: parsedEnd ?? undefined,
        confirmationNumber: confirmation.trim() || undefined,
        cost: costVal,
        currency: costVal != null ? currency : undefined,
        bookingUrl: bookingUrl.trim() || undefined,
        notes: notes.trim() || undefined,
      }
      return { ...base, type: 'travel', mode: travelMode, flightNumber: flightNumber.trim() || undefined, origin: origin.trim(), destination: destination.trim() } as TravelEntry
    }

    const base = {
      id: existing?.id ?? generateId(),
      title: title.trim(),
      date,
      startTime: parsedStart ?? undefined,
      endTime: parsedEnd ?? undefined,
      confirmationNumber: confirmation.trim() || undefined,
      cost: costVal,
      currency: costVal != null ? currency : undefined,
      bookingUrl: bookingUrl.trim() || undefined,
      notes: notes.trim() || undefined,
    }
    if (type === 'stay') {
      if (!checkIn || !checkOut) { setError('Check-in and check-out dates are required'); return null }
      if (checkOut <= checkIn) { setError('Check-out must be after check-in'); return null }
      return { ...base, type: 'stay', accommodationType, address: address.trim() || undefined, checkIn, checkOut } as StayEntry
    }
    if (type === 'experience') {
      return { ...base, type: 'experience', location: expLocation.trim() || undefined } as ExperienceEntry
    }
    // place
    return { ...base, type: 'place', address: placeAddress.trim() || undefined } as PlaceEntry
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const entry = buildEntry()
    if (entry) onSaved(entry)
  }

  const isStay = type === 'stay'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {existing ? 'Edit entry' : 'Add entry'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          {/* Type selector */}
          {!existing && (
            <div>
              <label className={labelClass()}>Entry type</label>
              <div className="grid grid-cols-4 gap-2">
                {ENTRY_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { setType(t.value); setError('') }}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      type === t.value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title — not shown for travel (auto-generated from origin → destination) */}
          {type !== 'travel' && (
            <div>
              <label className={labelClass()}>Name</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={
                  type === 'stay' ? 'e.g. Shinjuku Hotel' :
                  type === 'experience' ? 'e.g. Tea ceremony' :
                  'e.g. Senso-ji Temple'
                }
                className={inputClass()} />
            </div>
          )}

          {/* Travel-specific */}
          {type === 'travel' && (
            <>
              <div>
                <label className={labelClass()}>Mode</label>
                <div className="flex gap-2 flex-wrap">
                  {TRAVEL_MODES.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setTravelMode(m.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                        travelMode === m.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass()}>From</label>
                  <input type="text" value={origin} onChange={e => setOrigin(e.target.value)}
                    placeholder="e.g. Tokyo (TYO)" className={inputClass()} />
                </div>
                <div>
                  <label className={labelClass()}>To</label>
                  <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                    placeholder="e.g. Osaka (OSA)" className={inputClass()} />
                </div>
              </div>
              {travelMode === 'flight' && (
                <div>
                  <label className={labelClass()}>Flight number</label>
                  <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                    placeholder="e.g. JL123" className={inputClass()} />
                </div>
              )}
              {travelMode === 'train' && (
                <div>
                  <label className={labelClass()}>Train / service number</label>
                  <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                    placeholder="e.g. Nozomi 15" className={inputClass()} />
                </div>
              )}
            </>
          )}

          {/* Stay-specific */}
          {type === 'stay' && (
            <>
              <div>
                <label className={labelClass()}>Type</label>
                <div className="flex gap-2 flex-wrap">
                  {ACCOMMODATION_TYPES.map(a => (
                    <button key={a.value} type="button"
                      onClick={() => setAccommodationType(a.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                        accommodationType === a.value
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-slate-200 text-slate-600 hover:border-purple-300'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass()}>Check-in</label>
                  <input type="date" value={checkIn} min={tripStartDate} max={tripEndDate}
                    onChange={e => setCheckIn(e.target.value)} className={inputClass()} />
                </div>
                <div>
                  <label className={labelClass()}>Check-out</label>
                  <input type="date" value={checkOut} min={checkIn} max={tripEndDate}
                    onChange={e => setCheckOut(e.target.value)} className={inputClass()} />
                </div>
              </div>
              <div>
                <label className={labelClass()}>Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. 1-2-3 Shinjuku, Tokyo" className={inputClass()} />
              </div>
            </>
          )}

          {/* Experience-specific */}
          {type === 'experience' && (
            <div>
              <label className={labelClass()}>Location</label>
              <input type="text" value={expLocation} onChange={e => setExpLocation(e.target.value)}
                placeholder="e.g. Uji, Kyoto" className={inputClass()} />
            </div>
          )}

          {/* Place-specific */}
          {type === 'place' && (
            <div>
              <label className={labelClass()}>Address</label>
              <input type="text" value={placeAddress} onChange={e => setPlaceAddress(e.target.value)}
                placeholder="e.g. 2 Chome-3-1 Asakusa, Taito" className={inputClass()} />
            </div>
          )}

          {/* Date (non-stay) */}
          {!isStay && (
            <div>
              <label className={labelClass()}>Date</label>
              <input type="date" value={date} min={tripStartDate} max={tripEndDate}
                onChange={e => setDate(e.target.value)} className={inputClass()} />
            </div>
          )}

          {/* Start / End time (non-stay) */}
          {!isStay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass()}>Start time</label>
                <input type="text" inputMode="numeric" value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  placeholder="e.g. 9:00 AM" className={inputClass()} />
              </div>
              <div>
                <label className={labelClass()}>End time</label>
                <input type="text" inputMode="numeric" value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  placeholder="e.g. 2:30 PM" className={inputClass()} />
              </div>
            </div>
          )}

          {/* Confirmation number */}
          <div>
            <label className={labelClass()}>Confirmation # <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="text" value={confirmation} onChange={e => setConfirmation(e.target.value)}
              placeholder="e.g. ABC123" className={inputClass()} />
          </div>

          {/* Cost + Currency */}
          <div>
            <label className={labelClass()}>Cost <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="flex gap-2">
              <input type="text" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)}
                placeholder="e.g. 12000" className={inputClass('flex-1 min-w-0')} />
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shrink-0"
              >
                {availableCurrencies.map(code => {
                  const c = getCurrencyByCode(code)
                  return (
                    <option key={code} value={code}>
                      {code}{c ? ` (${c.symbol})` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Booking URL */}
          <div>
            <label className={labelClass()}>Booking link <span className="text-slate-400 font-normal">(optional)</span></label>
            <input type="url" value={bookingUrl} onChange={e => setBookingUrl(e.target.value)}
              placeholder="https://…" className={inputClass()} />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass()}>Notes <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any extra details…"
              rows={2}
              className={inputClass('resize-none')} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              {existing ? 'Save changes' : 'Add entry'}
            </button>
          </div>

          {existing && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full border border-red-200 text-red-600 rounded-lg py-2 text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Delete entry
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
