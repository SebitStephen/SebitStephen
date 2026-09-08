import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Availability, BookingStatus, BookingWithDetails, Service } from '../types'

export function useProviderServices(providerId: string | undefined) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at')
    if (!error && data) setServices(data as Service[])
    setLoading(false)
  }, [providerId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addService(input: {
    title: string
    description: string
    price: number
    duration_minutes: number
  }) {
    if (!providerId) throw new Error('Not signed in')
    const { error } = await supabase.from('services').insert({ ...input, provider_id: providerId })
    if (error) throw error
    await refresh()
  }

  async function deleteService(id: string) {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { services, loading, addService, deleteService }
}

export function useProviderAvailability(providerId: string | undefined) {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('provider_id', providerId)
      .order('weekday')
    if (!error && data) setAvailability(data as Availability[])
    setLoading(false)
  }, [providerId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addWindow(input: { weekday: number; start_time: string; end_time: string }) {
    if (!providerId) throw new Error('Not signed in')
    const { error } = await supabase.from('availability').insert({ ...input, provider_id: providerId })
    if (error) throw error
    await refresh()
  }

  async function removeWindow(id: string) {
    const { error } = await supabase.from('availability').delete().eq('id', id)
    if (error) throw error
    await refresh()
  }

  return { availability, loading, addWindow, removeWindow }
}

export function useProviderBookings(providerId: string | undefined) {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!providerId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*, service:services(title, duration_minutes), customer:profiles(full_name)')
      .eq('provider_id', providerId)
      .order('scheduled_at', { ascending: false })
    if (!error && data) setBookings(data as unknown as BookingWithDetails[])
    setLoading(false)
  }, [providerId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function setStatus(id: string, status: BookingStatus) {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (error) throw error
    await refresh()

    supabase.functions
      .invoke('notify-booking', { body: { type: 'status_change', booking_id: id } })
      .catch(() => {
        // Best-effort email nudge -- a failure here shouldn't block the update.
      })
  }

  return { bookings, loading, refresh, setStatus }
}
