import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Subscription, SubscriptionInput } from '../types'

export function useSubscriptions(userId: string | undefined) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .order('renewal_date', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setSubscriptions(data as Subscription[])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function addSubscription(input: SubscriptionInput) {
    if (!userId) throw new Error('Not signed in')
    const { data, error: insertError } = await supabase
      .from('subscriptions')
      .insert({ ...input, user_id: userId })
      .select()
      .single()

    if (insertError) throw insertError
    setSubscriptions((prev) =>
      [...prev, data as Subscription].sort((a, b) => a.renewal_date.localeCompare(b.renewal_date)),
    )
  }

  async function updateSubscription(id: string, input: Partial<SubscriptionInput>) {
    const { data, error: updateError } = await supabase
      .from('subscriptions')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError
    setSubscriptions((prev) =>
      prev
        .map((sub) => (sub.id === id ? (data as Subscription) : sub))
        .sort((a, b) => a.renewal_date.localeCompare(b.renewal_date)),
    )
  }

  async function deleteSubscription(id: string) {
    const { error: deleteError } = await supabase.from('subscriptions').delete().eq('id', id)
    if (deleteError) throw deleteError
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== id))
  }

  async function toggleStatus(id: string, status: 'active' | 'cancelled') {
    const { data, error: updateError } = await supabase
      .from('subscriptions')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (updateError) throw updateError
    setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? (data as Subscription) : sub)))
  }

  async function markUsedToday(id: string) {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error: updateError } = await supabase
      .from('subscriptions')
      .update({ last_used_at: today })
      .eq('id', id)
      .select()
      .single()
    if (updateError) throw updateError
    setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? (data as Subscription) : sub)))
  }

  return {
    subscriptions,
    loading,
    error,
    refresh,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleStatus,
    markUsedToday,
  }
}
