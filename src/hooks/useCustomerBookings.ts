import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { BookingWithDetails } from '../types'

export function useCustomerBookings(userId: string | undefined) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const [bookingsRes, reviewsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, service:services(title, duration_minutes), provider:provider_profiles(business_name, city)')
        .eq('customer_id', userId)
        .order('scheduled_at', { ascending: false }),
      supabase.from('reviews').select('booking_id').eq('customer_id', userId),
    ])
    if (bookingsRes.data) setBookings(bookingsRes.data as unknown as BookingWithDetails[])
    if (reviewsRes.data) {
      setReviewedBookingIds(new Set(reviewsRes.data.map((r) => r.booking_id as string)))
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function createBooking(input: {
    provider_id: string
    service_id: string
    scheduled_at: string
    notes: string
  }) {
    if (!userId) throw new Error('Not signed in')
    // price/platform_fee/provider_payout are recomputed server-side from
    // the service's price -- see the bookings_set_price trigger.
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        customer_id: userId,
        provider_id: input.provider_id,
        service_id: input.service_id,
        scheduled_at: input.scheduled_at,
        notes: input.notes,
        price: 0,
        platform_fee: 0,
        provider_payout: 0,
      })
      .select()
      .single()
    if (error) throw error
    await refresh()

    supabase.functions
      .invoke('notify-booking', { body: { type: 'new_booking', booking_id: data.id } })
      .catch(() => {
        // Best-effort email nudge -- a failure here shouldn't block the booking.
      })
  }

  async function cancelBooking(id: string) {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    if (error) throw error
    await refresh()
  }

  async function leaveReview(bookingId: string, providerId: string, rating: number, comment: string) {
    if (!userId) throw new Error('Not signed in')
    const { error } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      customer_id: userId,
      provider_id: providerId,
      rating,
      comment,
    })
    if (error) throw error
    setReviewedBookingIds((prev) => new Set(prev).add(bookingId))
  }

  return { bookings, reviewedBookingIds, loading, refresh, createBooking, cancelBooking, leaveReview }
}
