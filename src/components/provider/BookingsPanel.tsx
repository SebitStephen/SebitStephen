import { useProviderBookings } from '../../hooks/useProviderPortal'
import { formatCurrency, formatDateTime } from '../../utils/format'

export function BookingsPanel({ providerId }: { providerId: string }) {
  const { bookings, loading, setStatus } = useProviderBookings(providerId)

  if (loading) return <p className="muted">Loading bookings…</p>
  if (bookings.length === 0) {
    return (
      <section className="panel">
        <p className="muted">No bookings yet.</p>
      </section>
    )
  }

  return (
    <div className="booking-list">
      {bookings.map((b) => (
        <section key={b.id} className="panel booking-row">
          <div>
            <strong>{b.service?.title ?? 'Service'}</strong>
            <p className="muted small">
              {b.customer?.full_name} · {formatDateTime(b.scheduled_at)}
            </p>
            <p className="muted small">
              {formatCurrency(b.price)} — you receive {formatCurrency(b.provider_payout)} after the platform fee
            </p>
            {b.notes && <p className="muted small">Note: {b.notes}</p>}
          </div>
          <div className="booking-actions">
            <span className={`badge badge-${b.status}`}>{b.status}</span>
            {b.status === 'pending' && (
              <>
                <button className="link" onClick={() => setStatus(b.id, 'accepted')}>
                  Accept
                </button>
                <button className="link danger" onClick={() => setStatus(b.id, 'declined')}>
                  Decline
                </button>
              </>
            )}
            {b.status === 'accepted' && (
              <button className="link" onClick={() => setStatus(b.id, 'completed')}>
                Mark completed
              </button>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
