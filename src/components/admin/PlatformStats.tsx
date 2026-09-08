import { useMemo } from 'react'
import { useAdminBookings, useAdminProviders } from '../../hooks/useAdmin'
import { formatCurrency } from '../../utils/format'

export function PlatformStats() {
  const { bookings, loading: bookingsLoading } = useAdminBookings()
  const { providers, loading: providersLoading } = useAdminProviders()

  const stats = useMemo(() => {
    const completed = bookings.filter((b) => b.status === 'completed')
    const revenue = completed.reduce((sum, b) => sum + b.platform_fee, 0)
    const gmv = completed.reduce((sum, b) => sum + b.price, 0)
    const approvedProviders = providers.filter((p) => p.is_approved).length
    return { completedCount: completed.length, revenue, gmv, approvedProviders }
  }, [bookings, providers])

  if (bookingsLoading || providersLoading) return <p className="muted">Loading…</p>

  return (
    <section className="panel">
      <h2>Platform stats</h2>
      <div className="summary-grid">
        <div className="stat-card">
          <span className="stat-label">Approved providers</span>
          <span className="stat-value">{stats.approvedProviders}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Completed bookings</span>
          <span className="stat-value">{stats.completedCount}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Gross booking value</span>
          <span className="stat-value">{formatCurrency(stats.gmv)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Platform revenue (fees)</span>
          <span className="stat-value">{formatCurrency(stats.revenue)}</span>
        </div>
      </div>
    </section>
  )
}
