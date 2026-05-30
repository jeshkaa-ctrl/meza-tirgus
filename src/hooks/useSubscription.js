import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const PLAN_FEATURES = {
  free:     { pdf: false, archive: false, listings: false, auctions_publish: false, waybills: false },
  pro:      { pdf: true,  archive: true,  listings: true,  auctions_publish: false, waybills: false },
  business: { pdf: true,  archive: true,  listings: true,  auctions_publish: true,  waybills: true  },
}

export function useSubscription() {
  const [plan,    setPlan]    = useState('free')
  const [status,  setStatus]  = useState('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function fetchSub() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('subscriptions')
        .select('plan_id, status, current_period_end')
        .eq('user_id', user.id)
        .single()

      if (!ignore && data) {
        const isExpired = new Date(data.current_period_end) < new Date()
        setPlan(isExpired ? 'free' : (data.plan_id || 'free'))
        setStatus(isExpired ? 'expired' : data.status)
      }
      if (!ignore) setLoading(false)
    }

    fetchSub()

    // Klausās auth izmaiņas — ja pieteicās/izrakstījās, atjaunina
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (!ignore) fetchSub()
    })

    return () => {
      ignore = true
      subscription.unsubscribe()
    }
  }, [])

  const can        = (feature) => PLAN_FEATURES[plan]?.[feature] ?? false
  const isPro      = plan === 'pro' || plan === 'business'
  const isBusiness = plan === 'business'

  return { plan, status, loading, can, isPro, isBusiness }
}
