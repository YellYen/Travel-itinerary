{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ useState \} from 'react'\
import type \{ Entry, TravelEntry, StayEntry, ExperienceEntry, PlaceEntry, TravelMode, AccommodationType \} from '../types'\
import \{ generateId \} from '../storage'\
\
interface Props \{\
  tripStartDate: string\
  onClose: () => void\
  onImported: (entries: Entry[]) => void\
\}\
\
type Status = 'idle' | 'parsing' | 'review' | 'error'\
\
const TYPE_EMOJI: Record<string, string> = \{\
  travel: '\uc0\u9992 \u65039 ', stay: '\u55356 \u57320 ', experience: '\u55356 \u57261 ', place: '\u55357 \u56525 ',\
\}\
\
// eslint-disable-next-line @typescript-eslint/no-explicit-any\
function processEntry(raw: Record<string, any>, tripStartDate: string): Entry | null \{\
  const date = typeof raw.date === 'string' && /^\\d\{4\}-\\d\{2\}-\\d\{2\}$/.test(raw.date)\
    ? raw.date : tripStartDate\
  const base = \{\
    id: generateId(),\
    title: String(raw.title ?? 'Imported entry'),\
    date,\
    startTime: raw.startTime ? String(raw.startTime) : undefined,\
    endTime: raw.endTime ? String(raw.endTime) : undefined,\
    cost: typeof raw.cost === 'number' ? raw.cost : undefined,\
    currency: raw.currency ? String(raw.currency) : undefined,\
    confirmationNumber: raw.confirmationNumber ? String(raw.confirmationNumber) : undefined,\
    bookingUrl: raw.bookingUrl ? String(raw.bookingUrl) : undefined,\
    notes: raw.notes ? String(raw.notes) : undefined,\
  \}\
  if (raw.type === 'travel') \{\
    return \{ ...base, type: 'travel',\
      mode: (['flight','train','bus','ferry','other'].includes(raw.mode) ? raw.mode : 'flight') as TravelMode,\
      origin: String(raw.origin ?? ''), destination: String(raw.destination ?? ''),\
      flightNumber: raw.flightNumber ? String(raw.flightNumber) : undefined,\
    \} as TravelEntry\
  \}\
  if (raw.type === 'stay') \{\
    return \{ ...base, type: 'stay',\
      accommodationType: (['hotel','hostel','airbnb','other'].includes(raw.accommodationType)\
        ? raw.accommodationType : 'hotel') as AccommodationType,\
      checkIn: typeof raw.checkIn === 'string' ? raw.checkIn : date,\
      checkOut: typeof raw.checkOut === 'string' ? raw.checkOut : date,\
      address: raw.address ? String(raw.address) : undefined,\
    \} as StayEntry\
  \}\
  if (raw.type === 'experience') \{\
    return \{ ...base, type: 'experience', location: raw.location ? String(raw.location) : undefined \} as ExperienceEntry\
  \}\
  if (raw.type === 'place') \{\
    return \{ ...base, type: 'place', address: raw.address ? String(raw.address) : undefined \} as PlaceEntry\
  \}\
  return null\
\}\
\
export default function ImportModal(\{ tripStartDate, onClose, onImported \}: Props) \{\
  const [text, setText] = useState('')\
  const [status, setStatus] = useState<Status>('idle')\
  const [parsedEntries, setParsedEntries] = useState<Entry[]>([])\
  const [errorMsg, setErrorMsg] = useState('')\
\
  async function handleParse() \{\
    if (!text.trim()) return\
    setStatus('parsing')\
    try \{\
      const res = await fetch('/api/parse-import', \{\
        method: 'POST',\
        headers: \{ 'Content-Type': 'application/json' \},\
        body: JSON.stringify(\{ text: text.trim() \}),\
      \})\
      const data = await res.json()\
      const processed = ((data.entries ?? []) as Record<string, unknown>[])\
        .map(e => processEntry(e as Record<string, never>, tripStartDate))\
        .filter((e): e is Entry => e !== null)\
      if (processed.length === 0) \{\
        setErrorMsg("No bookings found. Try pasting more of the confirmation \'97 include the booking details, dates, and prices.")\
        setStatus('error')\
      \} else \{\
        setParsedEntries(processed)\
        setStatus('review')\
      \}\
    \} catch \{\
      setErrorMsg('Something went wrong. Check your connection and try again.')\
      setStatus('error')\
    \}\
  \}\
\
  return (\
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">\
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">\
        <div className="flex items-center justify-between p-5 border-b border-slate-100">\
          <h2 className="text-lg font-semibold text-slate-800">Import booking</h2>\
          <button onClick=\{onClose\} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">\'d7</button>\
        </div>\
\
        <div className="p-5">\
          \{status === 'idle' && (\
            <div className="space-y-4">\
              <p className="text-sm text-slate-500">\
                Paste any booking confirmation \'97 a flight email, hotel booking, travel agent itinerary, or even a block of text describing your plans.\
              </p>\
              <textarea\
                value=\{text\}\
                onChange=\{e => setText(e.target.value)\}\
                placeholder="Paste your booking confirmation here\'85"\
                rows=\{10\}\
                autoFocus\
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"\
              />\
              <div className="flex gap-3">\
                <button onClick=\{onClose\}\
                  className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">\
                  Cancel\
                </button>\
                <button\
                  onClick=\{handleParse\}\
                  disabled=\{!text.trim()\}\
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-medium transition-colors"\
                >\
                  Parse \uc0\u8594 \
                </button>\
              </div>\
            </div>\
          )\}\
\
          \{status === 'parsing' && (\
            <div className="py-8 flex flex-col items-center gap-3 text-slate-500">\
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">\
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="44" strokeDashoffset="14" />\
              </svg>\
              <p className="text-sm">Parsing your booking\'85</p>\
            </div>\
          )\}\
\
          \{status === 'review' && (\
            <div className="space-y-4">\
              <p className="text-sm font-medium text-green-700">\
                \uc0\u10003  Found \{parsedEntries.length\} \{parsedEntries.length === 1 ? 'entry' : 'entries'\}\
              </p>\
              <div className="space-y-2 max-h-72 overflow-y-auto">\
                \{parsedEntries.map(e => (\
                  <div key=\{e.id\} className="flex items-start gap-3 bg-slate-50 rounded-lg px-3 py-2 text-sm">\
                    <span className="shrink-0">\{TYPE_EMOJI[e.type] ?? '\uc0\u55357 \u56523 '\}</span>\
                    <div className="min-w-0">\
                      <p className="font-medium text-slate-800 truncate">\{e.title\}</p>\
                      <p className="text-xs text-slate-500">\
                        \{e.type === 'stay'\
                          ? `$\{(e as StayEntry).checkIn\} \'96 $\{(e as StayEntry).checkOut\}`\
                          : e.date\}\
                        \{e.cost != null && ` \'b7 $\{e.currency ?? ''\} $\{e.cost.toLocaleString()\}`\}\
                      </p>\
                    </div>\
                  </div>\
                ))\}\
              </div>\
              <div className="flex gap-3 pt-1">\
                <button onClick=\{() => setStatus('idle')\}\
                  className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">\
                  \uc0\u8592  Back\
                </button>\
                <button onClick=\{() => onImported(parsedEntries)\}\
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">\
                  Add \{parsedEntries.length\} \{parsedEntries.length === 1 ? 'entry' : 'entries'\}\
                </button>\
              </div>\
            </div>\
          )\}\
\
          \{status === 'error' && (\
            <div className="space-y-4">\
              <p className="text-sm text-red-600">\{errorMsg\}</p>\
              <div className="flex gap-3">\
                <button onClick=\{onClose\}\
                  className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">\
                  Cancel\
                </button>\
                <button onClick=\{() => setStatus('idle')\}\
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">\
                  Try again\
                </button>\
              </div>\
            </div>\
          )\}\
        </div>\
      </div>\
    </div>\
  )\
\}}