export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'annual'

export type Category =
  | 'writing'
  | 'image'
  | 'video'
  | 'audio'
  | 'code'
  | 'productivity'
  | 'research'
  | 'other'

export type SubscriptionStatus = 'active' | 'cancelled'

export interface Subscription {
  id: string
  user_id: string
  name: string
  category: Category
  cost: number
  billing_cycle: BillingCycle
  renewal_date: string // ISO date, e.g. 2026-09-20
  last_used_at: string | null // ISO date
  status: SubscriptionStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export type SubscriptionInput = {
  name: string
  category: Category
  cost: number
  billing_cycle: BillingCycle
  renewal_date: string
  notes: string
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'writing', label: 'Writing' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'code', label: 'Code' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'research', label: 'Research' },
  { value: 'other', label: 'Other' },
]

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
]
