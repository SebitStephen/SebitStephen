import { useMemo } from 'react'
import type { Subscription } from '../types'
import { CATEGORIES } from '../types'
import { formatCurrency, isStale } from '../utils/billing'

export function CategoryOverlap({ subscriptions }: { subscriptions: Subscription[] }) {
  const active = subscriptions.filter((s) => s.status === 'active')

  const overlaps = useMemo(() => {
    const byCategory = new Map<string, Subscription[]>()
    for (const sub of active) {
      const list = byCategory.get(sub.category) ?? []
      list.push(sub)
      byCategory.set(sub.category, list)
    }
    return [...byCategory.entries()]
      .filter(([, subs]) => subs.length > 1)
      .map(([category, subs]) => ({
        category,
        label: CATEGORIES.find((c) => c.value === category)?.label ?? category,
        subs,
      }))
  }, [active])

  const staleSubs = active.filter((s) => isStale(s.last_used_at))

  if (overlaps.length === 0 && staleSubs.length === 0) {
    return (
      <section className="panel">
        <h2>Nudges</h2>
        <p className="muted">No overlaps or stale tools right now. Nice and lean.</p>
      </section>
    )
  }

  return (
    <section className="panel">
      <h2>Nudges</h2>
      {overlaps.length > 0 && (
        <div className="nudge-group">
          <h3>Possible overlap</h3>
          {overlaps.map(({ category, label, subs }) => (
            <p key={category} className="nudge-item">
              <strong>{label}:</strong> {subs.map((s) => s.name).join(', ')} — you're paying for{' '}
              {subs.length} tools in the same category (
              {formatCurrency(subs.reduce((sum, s) => sum + s.cost, 0))} combined per billing
              cycle).
            </p>
          ))}
        </div>
      )}
      {staleSubs.length > 0 && (
        <div className="nudge-group">
          <h3>Not used in 30+ days</h3>
          {staleSubs.map((s) => (
            <p key={s.id} className="nudge-item">
              <strong>{s.name}</strong> — {s.last_used_at ? 'last check-in was over a month ago' : 'never checked in as used'}. Costing {formatCurrency(s.cost)}/{s.billing_cycle}.
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
