import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Profile, Role } from '../types'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!error) setProfile(data as Profile)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** One-time onboarding: names the user, sets their city, and picks a role. */
  async function completeOnboarding(input: { full_name: string; city: string; role: Role }) {
    if (!userId) throw new Error('Not signed in')
    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name: input.full_name, city: input.city, role: input.role })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    setProfile(data as Profile)

    if (input.role === 'provider') {
      const { error: providerError } = await supabase.from('provider_profiles').insert({
        id: userId,
        category: 'cleaning',
        business_name: input.full_name,
        city: input.city,
      })
      // Ignore "already exists" if they somehow onboard twice.
      if (providerError && providerError.code !== '23505') throw providerError
    }
  }

  return { profile, loading, refresh, completeOnboarding }
}
