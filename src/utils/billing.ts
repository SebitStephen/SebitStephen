import type { BillingCycle } from '../types'

const CYCLE_TO_MONTHS: Record<BillingCycle, number> = {
  weekly: 12 / 52,
  monthly: 1,
  quarterly: 3,
  annual: 12,
}

/** Normalizes any billing cycle's cost into an equivalent monthly cost. */
export function toMonthlyCost(cost: number, cycle: BillingCycle): number {
  return cost / CYCLE_TO_MONTHS[cycle]
}

/** Normalizes any billing cycle's cost into an equivalent annual cost. */
export function toAnnualCost(cost: number, cycle: BillingCycle): number {
  return toMonthlyCost(cost, cycle) * 12
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Days from today until the given ISO date. Negative means it's in the past. */
export function daysUntil(isoDate: string): number {
  const target = startOfDay(new Date(`${isoDate}T00:00:00`))
  const today = startOfDay(new Date())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Days since the given ISO date. Negative means it's in the future. */
export function daysSince(isoDate: string): number {
  return -daysUntil(isoDate)
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** A subscription counts as "stale" once it hasn't been used in `days` days (or never). */
export function isStale(lastUsedAt: string | null, days = 30): boolean {
  if (!lastUsedAt) return true
  return daysSince(lastUsedAt) >= days
}
