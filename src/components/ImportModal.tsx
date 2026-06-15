import { useState, useEffect, useRef } from 'react'
import type { Entry, TravelEntry, StayEntry, ExperienceEntry, PlaceEntry, TravelMode, AccommodationType } from '../types'
import { generateId } from '../storage'

interface Props {
  tripStartDate: string
  onClose: () => void
  onImported: (entries: Entry[]) => void
}

const EXPIRY_SECONDS = 1800

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processEntry(raw: Record<string, any>, tripStartDate: string): Entry | null {
  const id = generateId()
  const date = typeof raw.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date)
    ? raw.date
    : tripStartDate

  const base = {
    id,
    title: String(raw.title ?? 'Imported entry'),
    date,
    startTime: raw.startTime ? String(raw.startTime) : undefined,
    endTime: raw.endTime ? String(raw.endTime) : undefined,
    cost: typeof raw.cost === 'number' ? raw.cost : undefined,
    currency: raw.currency ? String(raw.currency) : undefined,
    confirmationNumber: raw.confirmationNumber ? String(raw.confirmationNumber) : undefined,
    bookingUrl: raw.bookingUrl ? String(raw.bookingUrl) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
  }

  if (raw.type === 'travel') {
    return {
      ...base,
      type: 'travel',
      mode: (['flight','train','bus','ferry','other'].includes(raw.mode) ? raw.mode : 'flight') as TravelMode,
      origin: String(raw.origin ?? ''),
      destination: String(raw.destination ?? ''),
      flightNumber: raw.flightNumber ? String(raw.flightNumber) : undefined,
    } as TravelEntry
  }
  if (raw.type === 'stay') {
    const checkIn = typeof raw.checkIn === 'string' ? raw.checkIn : date
    const checkOut = typeof raw.checkOut === 'string' ? raw.checkOut : date
    return {
      ...base,
      type: 'stay',
      accommodationType: (['hotel','hostel','airbnb','other'].includes(raw.accommodationType)
        ? raw.accommodationType : 'hotel') as AccommodationType,
      checkIn,
      checkOut,
      address: raw.address ? String(raw.address) : undefined,
    } as StayEntry
  }
  if (raw.type === 'experience') {
    return { ...base, type: 'experience', location: raw.location ? String(raw.location) : undefined } as ExperienceEntry
  }
  if (raw.type === 'place') {
    return { ...base, type: 'place', address: raw.address ? String(raw.address) : undefined } as PlaceEntry
  }
  return null
}

const TYPE_EMOJI: Record<string, string> = {
  travel: '✈️', stay: '🏨', experience: '🎭', place: '📍',
}

export default function ImportModal({ tripStartDate, onClose, onImported }: Props) {
  const [code] = useState(generateCode)
  const [importEmail, setImportEmail] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS)
  const [parsedEntries, setParsedEntries] = useState<Entry[] | null>(null)
  const [copied, setCopied] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Fetch the import email address from the server
    fetch('/api/import-email-address')
      .then(r => r.json())
      .then(d => setImportEmail(d.address))
      .catch(() => setImportEmail(null))

    // Countdown
    countdownRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(pollRef.current!)
          clearInterval(countdownRef.current!)
          return 0
        }
        return t - 1
      })
    }, 1000)

    // Poll for results every 3 seconds
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/get-import?code=${code}`)
        const data = await res.json()
        if (data.entries && Array.isArray(data.entries) && data.entries.length > 0) {
          clearInterval(pollRef.current!)
          clearInterval(countdownRef.current!)
          const processed = (data.entries as Record<string, unknown>[])
            .map(e => processEntry(e as Record<string, never>, tripStartDate))
            .filter((e): e is Entry => e !== null)
          setParsedEntries(processed)
        }
      } catch {
        // network error — keep polling
      }
    }, 3000)

    return () => {
      clearInterval(pollRef.current!)
      clearInterval(countdownRef.current!)
    }
  }, [code, tripStartDate])

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const expired = timeLeft === 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Import from email</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          {parsedEntries ? (
            /* ── Review state ── */
            <>
              <div className="flex items-center gap-2 text-green-700">
                <span className="text-xl">✓</span>
                <span className="font-medium">Found {parsedEntries.length} {parsedEntries.length === 1 ? 'entry' : 'entries'}</span>
              </div>
              <div className="space-y-2">
                {parsedEntries.map(e => (
                  <div key={e.id} className="flex items-start gap-3 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                    <span>{TYPE_EMOJI[e.type] ?? '📋'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{e.title}</p>
                      <p className="text-xs text-slate-500">
                        {e.type === 'stay'
                          ? `${(e as StayEntry).checkIn} – ${(e as StayEntry).checkOut}`
                          : e.date}
                        {e.cost != null && ` · ${e.currency ?? 'USD'} ${e.cost.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={onClose}
                  className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => onImported(parsedEntries)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                  Add {parsedEntries.length} {parsedEntries.length === 1 ? 'entry' : 'entries'}
                </button>
              </div>
            </>
          ) : expired ? (
            /* ── Expired state ── */
            <>
              <p className="text-slate-500 text-sm">This import code has expired. Close and try again to generate a new code.</p>
              <button onClick={onClose}
                className="w-full border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
                Close
              </button>
            </>
          ) : (
            /* ── Waiting state ── */
            <>
              {importEmail ? (
                <>
                  <div>
                    <p className="text-sm text-slate-600 mb-1.5">1. Forward your booking confirmation to:</p>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                      <span className="text-sm font-mono text-slate-800 flex-1 truncate">{importEmail}</span>
                      <button
                        onClick={() => handleCopy(importEmail)}
                        className="text-xs text-blue-600 hover:text-blue-800 shrink-0 font-medium"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1.5">2. Include this code in the subject line:</p>
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-5 py-3 text-center flex-1">
                        <span className="text-2xl font-mono font-bold tracking-widest text-blue-700">[{code}]</span>
                      </div>
                      <button
                        onClick={() => handleCopy(`[${code}]`)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                      e.g. <span className="font-mono">Fwd: [{code}] JL402 confirmation</span>
                    </p>
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                  Email import is not configured. Ask the app owner to set the <code>IMPORT_EMAIL</code> environment variable.
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-slate-500 pt-1">
                <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="10" />
                </svg>
                Waiting for email… expires in {formatTime(timeLeft)}
              </div>

              <button onClick={onClose}
                className="w-full border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
