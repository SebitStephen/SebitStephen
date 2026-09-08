import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { BookingWithDetails, ProviderProfile } from '../types'

export function useAdminProviders() {
  const [providers, setProviders] = useState<ProviderProfile[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('provider_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setProviders(data as ProviderProfile[])
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function setApproved(id: string, isApproved: boolean) {
    const { error } = await supabase.from('provider_profiles').update({ is_approved: isApproved }).eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { providers, loading, refresh, setApproved }
}

export function useAdminBookings() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('bookings')
      .select(
        '*, service:services(title, duration_minutes), provider:provider_profiles(business_name, city), customer:profiles(full_name)',
      )
      .order('scheduled_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (!error && data) setBookings(data as unknown as BookingWithDetails[])
        setLoading(false)
      })
  }, [])

  return { bookings, loading }
}
