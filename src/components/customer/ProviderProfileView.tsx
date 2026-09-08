import { useState } from 'react'
import { useProviderDetail } from '../../hooks/useMarketplace'
import { useCustomerBookings } from '../../hooks/useCustomerBookings'
import type { Service } from '../../types'
import { formatCurrency, stars } from '../../utils/format'
import { BookingModal } from './BookingModal'

export function ProviderProfileView({
  providerId,
  customerId,
  onBack,
}: {
  providerId: string
  customerId: string
  onBack: () => void
}) {
  const { provider, availability, reviews, loading } = useProviderDetail(providerId)
  const { createBooking } = useCustomerBookings(customerId)
  const [bookingService, setBookingService] = useState<Service | null>(null)

  if (loading || !provider) return <p className="muted">Loading provider…</p>

  return (
    <div>
      <button className="link" onClick={onBack}>
        ← Back to results
      </button>

      <section className="panel">
        <h2>{provider.business_name}</h2>
        <p className="muted">{provider.city}</p>
        <p className="rating">
          {stars(provider.avg_rating)} <span className="muted small">({provider.review_count} reviews)</span>
        </p>
        {provider.bio && <p>{provider.bio}</p>}
      </section>

      <section className="panel">
        <h3>Services</h3>
        {provider.services.length === 0 ? (
          <p className="muted">This provider hasn't listed any services yet.</p>
        ) : (
          <ul className="service-list">
            {provider.services.map((s) => (
              <li key={s.id} className="service-row">
                <div>
                  <strong>{s.title}</strong>
                  <p className="muted small">{s.description || `${s.duration_minutes} min`}</p>
                </div>
                <div className="service-actions">
                  <span>{formatCurrency(s.price)}</span>
                  <button onClick={() => setBookingService(s)}>Book now</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h3>Reviews</h3>
        {reviews.length === 0 ? (
          <p className="muted">No reviews yet — be the first to book.</p>
        ) : (
          <ul className="review-list">
            {reviews.map((r) => (
              <li key={r.id}>
                <span className="rating">{stars(r.rating)}</span>
                {r.comment && <p>{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {bookingService && (
        <BookingModal
          provider={provider}
          service={bookingService}
          availability={availability}
          onClose={() => setBookingService(null)}
          onConfirm={async (scheduledAt, notes) => {
            await createBooking({
              provider_id: provider.id,
              service_id: bookingService.id,
              scheduled_at: scheduledAt,
              notes,
            })
            setBookingService(null)
          }}
        />
      )}
    </div>
  )
}
