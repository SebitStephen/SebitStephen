import { useState } from 'react'
import { useCustomerBookings } from '../../hooks/useCustomerBookings'
import { formatCurrency, formatDateTime } from '../../utils/format'
import type { BookingWithDetails } from '../../types'

const TABS = [
  { key: 'upcoming', label: 'Upcoming', statuses: ['pending', 'accepted'] },
  { key: 'completed', label: 'Completed', statuses: ['completed'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['declined', 'cancelled'] },
] as const

export function MyBookings({ customerId }: { customerId: string }) {
  const { bookings, loading, reviewedBookingIds, cancelBooking, leaveReview } = useCustomerBookings(customerId)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('upcoming')
  const [reviewing, setReviewing] = useState<BookingWithDetails | null>(null)

  const active = TABS.find((t) => t.key === tab)!
  const filtered = bookings.filter((b) => (active.statuses as readonly string[]).includes(b.status))

  return (
    <div>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'tab active' : 'tab'} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="muted">Loading bookings…</p>
      ) : filtered.length === 0 ? (
        <section className="panel">
          <p className="muted">Nothing here yet.</p>
        </section>
      ) : (
        <div className="booking-list">
          {filtered.map((b) => (
            <section key={b.id} className="panel booking-row">
              <div>
                <strong>{b.service?.title ?? 'Service'}</strong>
                <p className="muted small">
                  {b.provider?.business_name} · {formatDateTime(b.scheduled_at)}
                </p>
                <p className="muted small">{formatCurrency(b.price)}</p>
                {b.notes && <p className="muted small">Note: {b.notes}</p>}
              </div>
              <div className="booking-actions">
                <span className={`badge badge-${b.status}`}>{b.status}</span>
                {(b.status === 'pending' || b.status === 'accepted') && (
                  <button className="link danger" onClick={() => cancelBooking(b.id)}>
                    Cancel
                  </button>
                )}
                {b.status === 'completed' && !reviewedBookingIds.has(b.id) && (
                  <button className="link" onClick={() => setReviewing(b)}>
                    Leave a review
                  </button>
                )}
                {b.status === 'completed' && reviewedBookingIds.has(b.id) && (
                  <span className="muted small">Reviewed ✓</span>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {reviewing && (
        <ReviewForm
          booking={reviewing}
          onClose={() => setReviewing(null)}
          onSubmit={async (rating, comment) => {
            await leaveReview(reviewing.id, reviewing.provider_id, rating, comment)
            setReviewing(null)
          }}
        />
      )}
    </div>
  )
}

function ReviewForm({
  booking,
  onClose,
  onSubmit,
}: {
  booking: BookingWithDetails
  onClose: () => void
  onSubmit: (rating: number, comment: string) => Promise<void>
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(rating, comment)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Review {booking.provider?.business_name}</h2>

        <label htmlFor="rating">Rating</label>
        <select id="rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {'★'.repeat(n)}
            </option>
          ))}
        </select>

        <label htmlFor="comment">Comment (optional)</label>
        <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} />

        {error && <p className="error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" disabled={submitting} onClick={handleSubmit}>
            {submitting ? 'Saving…' : 'Submit review'}
          </button>
        </div>
      </div>
    </div>
  )
}
