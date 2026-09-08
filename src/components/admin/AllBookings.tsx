import { useAdminBookings } from '../../hooks/useAdmin'
import { formatCurrency, formatDateTime } from '../../utils/format'

export function AllBookings() {
  const { bookings, loading } = useAdminBookings()

  if (loading) return <p className="muted">Loading…</p>

  return (
    <section className="panel">
      <h2>Recent bookings</h2>
      {bookings.length === 0 ? (
        <p className="muted">No bookings yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Provider</th>
                <th>Service</th>
                <th>When</th>
                <th>Price</th>
                <th>Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.customer?.full_name}</td>
                  <td>{b.provider?.business_name}</td>
                  <td>{b.service?.title}</td>
                  <td>{formatDateTime(b.scheduled_at)}</td>
                  <td>{formatCurrency(b.price)}</td>
                  <td>{formatCurrency(b.platform_fee)}</td>
                  <td>
                    <span className={`badge badge-${b.status}`}>{b.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
