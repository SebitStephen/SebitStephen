export type Role = 'customer' | 'provider' | 'admin'
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'

export interface Category {
  slug: string
  label: string
  icon: string
  is_live: boolean
}

export interface Profile {
  id: string
  role: Role
  full_name: string
  phone: string | null
  city: string | null
  created_at: string
}

export interface ProviderProfile {
  id: string
  category: string
  business_name: string
  bio: string
  city: string
  is_approved: boolean
  avg_rating: number
  review_count: number
  created_at: string
}

export interface Service {
  id: string
  provider_id: string
  title: string
  description: string
  price: number
  duration_minutes: number
  created_at: string
}

export interface Availability {
  id: string
  provider_id: string
  weekday: number // 0 = Sunday ... 6 = Saturday
  start_time: string // "09:00:00"
  end_time: string
}

export interface Booking {
  id: string
  customer_id: string
  provider_id: string
  service_id: string
  scheduled_at: string // ISO timestamp
  status: BookingStatus
  notes: string
  price: number
  platform_fee: number
  provider_payout: number
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id: string
  customer_id: string
  provider_id: string
  rating: number
  comment: string
  created_at: string
}

// Joined shapes the UI actually renders.
export interface ProviderWithServices extends ProviderProfile {
  services: Service[]
}

export interface BookingWithDetails extends Booking {
  service: Pick<Service, 'title' | 'duration_minutes'> | null
  provider: Pick<ProviderProfile, 'business_name' | 'city'> | null
  customer: Pick<Profile, 'full_name'> | null
}

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const PLATFORM_FEE_PERCENT = 0.1
