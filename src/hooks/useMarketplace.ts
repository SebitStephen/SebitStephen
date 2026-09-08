import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Availability, Category, ProviderWithServices, Review } from '../types'
import type { BusySlot } from '../utils/slots'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('label')
      .then(({ data }) => {
        if (data) setCategories(data as Category[])
      })
  }, [])

  return categories
}

export function useProviderSearch(category: string, city: string) {
  const [providers, setProviders] = useState<ProviderWithServices[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('provider_profiles')
      .select('*, services(*)')
      .eq('is_approved', true)
      .eq('category', category)
      .order('avg_rating', { ascending: false })

    if (city.trim()) {
      query = query.ilike('city', `%${city.trim()}%`)
    }

    const { data, error } = await query
    if (!error && data) setProviders(data as ProviderWithServices[])
    setLoading(false)
  }, [category, city])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { providers, loading, refresh }
}

export function useProviderDetail(providerId: string | null) {
  const [provider, setProvider] = useState<ProviderWithServices | null>(null)
  const [availability, setAvailability] = useState<Availability[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    const [providerRes, availabilityRes, reviewsRes] = await Promise.all([
      supabase.from('provider_profiles').select('*, services(*)').eq('id', providerId).single(),
      supabase.from('availability').select('*').eq('provider_id', providerId).order('weekday'),
      supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false }),
    ])
    if (providerRes.data) setProvider(providerRes.data as ProviderWithServices)
    if (availabilityRes.data) setAvailability(availabilityRes.data as Availability[])
    if (reviewsRes.data) setReviews(reviewsRes.data as Review[])
    setLoading(false)
  }, [providerId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { provider, availability, reviews, loading, refresh }
}

/**
 * Busy time ranges for a provider on a given day, via the
 * provider_busy_slots() RPC (RLS blocks a plain select on other
 * customers' bookings, which is the point).
 */
export function useProviderBusySlots(providerId: string, date: string) {
  const [busy, setBusy] = useState<BusySlot[]>([])

  useEffect(() => {
    if (!providerId || !date) return
    supabase
      .rpc('provider_busy_slots', { p_provider_id: providerId, p_date: date })
      .then(({ data }) => {
        if (data) setBusy(data as BusySlot[])
      })
  }, [providerId, date])

  return busy
}
