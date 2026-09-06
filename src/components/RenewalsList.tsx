import type { Subscription } from '../types'
import { daysUntil, formatCurrency, formatDate } from '../utils/billing'

export function RenewalsList({ subscriptions }: { subscriptions: Subscription[] }) {
  const upcoming = subscriptions
    .filter((s) => s.status === 'active' && daysUntil(s.renewal_date) >= 0)
    .sort((a, b) => a.renewal_date.localeCompare(b.renewal_date))
    .slice(0, 5)

  if (upcoming.length === 0) {
    return (
      <section className="panel">
        <h2>Upcoming renewals</h2>
        <p className="muted">No upcoming renewals. Add a subscription to get started.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Upcoming renewals</h2>
      <ul className="renewal-list">
        {upcoming.map((sub) => {
          const days = daysUntil(sub.renewal_date)
          const urgent = days <= 3
          return (
            <li key={sub.id} className={urgent ? 'renewal-item urgent' : 'renewal-item'}>
              <div>
                <strong>{sub.name}</strong>
                <span className="muted"> · {formatCurrency(sub.cost)}</span>
              </div>
              <div className="renewal-date">
                {formatDate(sub.renewal_date)}
                <span className="muted"> ({days === 0 ? 'today' : `${days}d`})</span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
