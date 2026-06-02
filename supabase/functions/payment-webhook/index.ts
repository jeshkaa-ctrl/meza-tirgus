import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const body = await req.text()

    // Montonio sūta JWT kā request body (nevis parakstu headerā)
    const secretKey = Deno.env.get('MONTONIO_SECRET_KEY')
    if (!secretKey) {
      console.error('MONTONIO_SECRET_KEY nav iestatīts')
      return new Response('Server error', { status: 500 })
    }

    // Verifikācija
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    )

    let event: Record<string, unknown>
    try {
      // Body var būt JSON ar { data: JWT } vai tieši JWT
      let tokenStr = body
      try {
        const parsed = JSON.parse(body)
        if (parsed.data) tokenStr = parsed.data
      } catch {}

      event = await verify(tokenStr, cryptoKey) as Record<string, unknown>
    } catch (e) {
      console.error('JWT verifikācija neizdevās:', e)
      return new Response('Unauthorized', { status: 401 })
    }

    console.log('Webhook saņemts:', JSON.stringify(event))

    // Tikai finalizētos maksājumus apstrādājam
    const status = event.payment_status as string
    if (status !== 'finalized') {
      console.log('Maksājums nav finalizēts, statuss:', status)
      return new Response('OK', { status: 200 })
    }

    // Nolasām metadata
    let metadata: { userId?: string; planId?: string; billingCycle?: string } = {}
    try {
      const raw = event.metadata as string
      metadata = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
      console.error('Nevar nolasīt metadata')
      return new Response('Bad metadata', { status: 400 })
    }

    const { userId, planId, billingCycle } = metadata
    if (!userId || !planId) {
      console.error('Trūkst userId vai planId metadata')
      return new Response('Bad metadata', { status: 400 })
    }

    // Supabase admin klients (service role — apiet RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_KEY')!,
      { auth: { persistSession: false } }
    )

    if (billingCycle === 'onetime') {
      // Vienreizējs maksājums — ieraksta one_time_payments
      const { error } = await supabase.from('one_time_payments').insert({
        user_id: userId,
        plan_id: planId,
        merchant_ref: event.merchant_reference as string,
        amount: event.grand_total as number,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      if (error) console.error('one_time_payments kļūda:', error)
      else console.log('Vienreizējs maksājums ierakstīts:', planId)

    } else {
      // Abonements — atjaunina subscriptions
      const isYearly    = billingCycle === 'yearly'
      const periodMs    = isYearly ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
      const periodEnd   = new Date(Date.now() + periodMs)

      const { error } = await supabase.from('subscriptions').upsert({
        user_id:              userId,
        plan_id:              planId,
        status:               'active',
        billing_cycle:        billingCycle,
        current_period_start: new Date().toISOString(),
        current_period_end:   periodEnd.toISOString(),
      }, { onConflict: 'user_id' })

      if (error) console.error('subscriptions kļūda:', error)
      else console.log(`Abonements aktivizēts: ${planId} (${billingCycle}) līdz ${periodEnd.toLocaleDateString('lv-LV')}`)
    }

    return new Response('OK', { status: 200 })

  } catch (err) {
    console.error('Webhook kļūda:', err)
    return new Response('Internal error', { status: 500 })
  }
})
