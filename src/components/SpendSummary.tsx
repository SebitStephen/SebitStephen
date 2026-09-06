import { useMemo } from 'react'
import type { Subscription } from '../types'
import { formatCurrency, toAnnualCost, toMonthlyCost } from '../utils/billing'

export function SpendSummary({ subscriptions }: { subscriptions: Subscription[] }) {
  const { monthly, annual, active } = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.status === 'active')
    const monthlyTotal = activeSubs.reduce(
      (sum, s) => sum + toMonthlyCost(s.cost, s.billing_cycle),
      0,
    )
    const annualTotal = activeSubs.reduce(
      (sum, s) => sum + toAnnualCost(s.cost, s.billing_cycle),
      0,
    )
    return { monthly: monthlyTotal, annual: annualTotal, active: activeSubs.length }
  }, [subscriptions])

  return (
    <div className="summary-grid">
      <div className="stat-card">
        <span className="stat-label">Monthly spend</span>
        <span className="stat-value">{formatCurrency(monthly)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Annual spend</span>
        <span className="stat-value">{formatCurrency(annual)}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Active tools</span>
        <span className="stat-value">{active}</span>
      </div>
    </div>
  )
}
