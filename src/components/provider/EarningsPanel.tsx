import { useMemo } from 'react'
import { useProviderBookings } from '../../hooks/useProviderPortal'
import { formatCurrency } from '../../utils/format'

export function EarningsPanel({ providerId }: { providerId: string }) {
  const { bookings, loading } = useProviderBookings(providerId)

  const stats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === 'completed')
    const upcoming = bookings.filter((b) => b.status === 'accepted')
    const totalEarned = completed.reduce((sum, b) => sum + b.provider_payout, 0)
    const pendingPayout = upcoming.reduce((sum, b) => sum + b.provider_payout, 0)
    return { completedCount: completed.length, totalEarned, pendingPayout }
  }, [bookings])

  if (loading) return <p className="muted">Loading…</p>

  return (
    <section className="panel">
      <h2>Earnings</h2>
      <div className="summary-grid">
        <div className="stat-card">
          <span className="stat-label">Completed jobs</span>
          <span className="stat-value">{stats.completedCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total earned</span>
          <span className="stat-value">{formatCurrency(stats.totalEarned)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Pending (accepted jobs)</span>
          <span className="stat-value">{formatCurrency(stats.pendingPayout)}</span>
        </div>
      </div>
      <p className="muted small" style={{ marginTop: 12 }}>
        Payouts shown are after LocalPro's 10% platform fee. Actual payment collection isn't wired
        up yet in this MVP — see the README roadmap.
      </p>
    </section>
  )
}
