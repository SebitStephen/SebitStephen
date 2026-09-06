import type { Subscription } from '../types'
import { CATEGORIES } from '../types'
import { daysSince, formatCurrency, formatDate, isStale } from '../utils/billing'

export function SubscriptionTable({
  subscriptions,
  onEdit,
  onDelete,
  onMarkUsed,
  onToggleStatus,
}: {
  subscriptions: Subscription[]
  onEdit: (sub: Subscription) => void
  onDelete: (id: string) => void
  onMarkUsed: (id: string) => void
  onToggleStatus: (id: string, status: 'active' | 'cancelled') => void
}) {
  if (subscriptions.length === 0) {
    return (
      <section className="panel">
        <h2>Your subscriptions</h2>
        <p className="muted">Nothing added yet. Use the form to track your first tool.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Your subscriptions</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Cost</th>
              <th>Renews</th>
              <th>Last used</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub) => {
              const stale = sub.status === 'active' && isStale(sub.last_used_at)
              return (
                <tr key={sub.id} className={sub.status === 'cancelled' ? 'row-cancelled' : ''}>
                  <td>
                    <strong>{sub.name}</strong>
                    {sub.notes && <div className="muted small">{sub.notes}</div>}
                  </td>
                  <td>{CATEGORIES.find((c) => c.value === sub.category)?.label}</td>
                  <td>
                    {formatCurrency(sub.cost)}
                    <span className="muted small"> / {sub.billing_cycle}</span>
                  </td>
                  <td>{formatDate(sub.renewal_date)}</td>
                  <td className={stale ? 'stale' : ''}>
                    {sub.last_used_at ? `${formatDate(sub.last_used_at)} (${daysSince(sub.last_used_at)}d ago)` : 'Never'}
                  </td>
                  <td>
                    <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                  </td>
                  <td className="row-actions">
                    <button className="link" onClick={() => onMarkUsed(sub.id)}>
                      Used today
                    </button>
                    <button className="link" onClick={() => onEdit(sub)}>
                      Edit
                    </button>
                    <button
                      className="link"
                      onClick={() =>
                        onToggleStatus(sub.id, sub.status === 'active' ? 'cancelled' : 'active')
                      }
                    >
                      {sub.status === 'active' ? 'Cancel' : 'Reactivate'}
                    </button>
                    <button className="link danger" onClick={() => onDelete(sub.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
