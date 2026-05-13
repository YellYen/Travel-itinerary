import { useState } from 'react'
import type { Trip } from '../types'
import { saveTrip, generateId } from '../storage'

interface Props {
  existing: Trip | null
  onClose: () => void
  onSaved: () => void
  onDelete?: () => void
}

const ic = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function TripModal({ existing, onClose, onSaved, onDelete }: Props) {
  const [name, setName] = useState(existing?.name ?? '')
  const [startDate, setStartDate] = useState(existing?.startDate ?? '')
  const [endDate, setEndDate] = useState(existing?.endDate ?? '')
  const [currency, setCurrency] = useState(existing?.currency ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Trip name is required'); return }
    if (!startDate) { setError('Start date is required'); return }
    if (!endDate) { setError('End date is required'); return }
    if (endDate < startDate) { setError('End date must be after start date'); return }

    const trip: Trip = {
      id: existing?.id ?? generateId(),
      name: name.trim(),
      startDate,
      endDate,
      entries: existing?.entries ?? [],
      currency: currency.trim() || undefined,
      notes: notes.trim() || undefined,
    }
    saveTrip(trip)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {existing ? 'Edit Trip' : 'New Trip'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trip name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Japan Spring 2026" className={ic} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End date</label>
              <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className={ic} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Currency symbol <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input type="text" value={currency} onChange={e => setCurrency(e.target.value)}
              placeholder="e.g. $ £ € ¥" className={ic} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Packing list, visa info, tips…"
              rows={3}
              className={`${ic} resize-none`} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              {existing ? 'Save changes' : 'Create trip'}
            </button>
          </div>
          {existing && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full border border-red-200 text-red-500 hover:bg-red-50 rounded-lg py-2 text-sm font-medium transition-colors"
            >
              Delete trip
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
