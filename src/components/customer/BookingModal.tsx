import { useState } from 'react'
import type { Availability, ProviderProfile, Service } from '../../types'
import { useProviderBusySlots } from '../../hooks/useMarketplace'
import { getAvailableSlots } from '../../utils/slots'
import { formatCurrency } from '../../utils/format'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function BookingModal({
  provider,
  service,
  availability,
  onClose,
  onConfirm,
}: {
  provider: ProviderProfile
  service: Service
  availability: Availability[]
  onClose: () => void
  onConfirm: (scheduledAtIso: string, notes: string) => Promise<void>
}) {
  const [date, setDate] = useState(todayISO())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = useProviderBusySlots(provider.id, date)
  const slots = getAvailableSlots(date, service.duration_minutes, availability, busy)

  async function handleConfirm() {
    if (!selectedSlot) return
    setError(null)
    setSubmitting(true)
    try {
      await onConfirm(selectedSlot, notes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create booking')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Book {service.title}</h2>
        <p className="muted">
          {provider.business_name} · {formatCurrency(service.price)} · {service.duration_minutes} min
        </p>

        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          min={todayISO()}
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setSelectedSlot(null)
          }}
        />

        <label>Available times</label>
        {slots.length === 0 ? (
          <p className="muted small">No open slots this day. Try another date.</p>
        ) : (
          <div className="slot-grid">
            {slots.map((slot) => {
              const iso = slot.toISOString()
              return (
                <button
                  key={iso}
                  type="button"
                  className={selectedSlot === iso ? 'slot active' : 'slot'}
                  onClick={() => setSelectedSlot(iso)}
                >
                  {slot.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </button>
              )
            })}
          </div>
        )}

        <label htmlFor="notes">Notes for the provider (optional)</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Gate code, pets, parking…"
        />

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" disabled={!selectedSlot || submitting} onClick={handleConfirm}>
            {submitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </div>
      </div>
    </div>
  )
}
