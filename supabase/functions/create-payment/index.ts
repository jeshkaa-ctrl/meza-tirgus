import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cenas centos (EUR * 100)
const CENAS: Record<string, number> = {
  pro_monthly:       1900,  // €19.00
  pro_yearly:       15900,  // €159.00
  business_monthly:  5900,  // €59.00
  business_yearly:  49000,  // €490.00
  pdf_onetime:        250,  // €2.50
  listing_onetime:    500,  // €5.00
  listing_featured:  1500,  // €15.00
}

const NOSAUKUMI: Record<string, string> = {
  pro_monthly:      'Meža tirgus Pro — mēneša abonements',
  pro_yearly:       'Meža tirgus Pro — gada abonements',
  business_monthly: 'Meža tirgus Komercija — mēneša abonements',
  business_yearly:  'Meža tirgus Komercija — gada abonements',
  pdf_onetime:      'Meža tirgus — PDF lejupielāde',
  listing_onetime:  'Meža tirgus — sludinājuma publicēšana',
  listing_featured: 'Meža tirgus — izcelts sludinājums',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, planId, billingCycle } = await req.json()

    if (!userId || !planId) {
      return new Response(JSON.stringify({ error: 'Trūkst userId vai planId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const kēysKombinācija = billingCycle ? `${planId}_${billingCycle}` : planId
    const summa = CENAS[kēysKombinācija]

    if (!summa) {
      return new Response(JSON.stringify({ error: `Nezināms plāns: ${kēysKombinācija}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessKey  = Deno.env.get('MONTONIO_ACCESS_KEY')
    const secretKey  = Deno.env.get('MONTONIO_SECRET_KEY')
    const appUrl     = Deno.env.get('APP_URL') || 'https://meza-tirgus.lv'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')

    if (!accessKey || !secretKey) {
      return new Response(JSON.stringify({ error: 'Montonio atslēgas nav konfigurētas' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const merchantRef = `MT_${userId.slice(0, 8)}_${Date.now()}`
    const summaEur    = summa / 100

    const payload = {
      access_key: accessKey,
      merchant_reference: merchantRef,
      return_url: `${appUrl}/?payment=success&plan=${planId}&ref=${merchantRef}`,
      notification_url: `${supabaseUrl}/functions/v1/payment-webhook`,
      currency: 'EUR',
      grand_total: summaEur,
      locale: 'lv',
      payment: {
        method: 'paymentInitiation',
        currency: 'EUR',
        amount: summaEur,
        method_options: {
          payment_description: NOSAUKUMI[kēysKombinācija] || 'Meža tirgus maksājums',
        },
      },
      line_items: [{
        name: NOSAUKUMI[kēysKombinācija] || planId,
        quantity: 1,
        final_price: summaEur,
      }],
      // Metadata — webhook to izmanto Supabase atjaunināšanai
      metadata: JSON.stringify({ userId, planId, billingCycle: billingCycle || 'onetime' }),
    }

    // Paraksta JWT ar HS256
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    )

    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      { ...payload, exp: getNumericDate(600) }, // 10 minūtes derīgs
      cryptoKey
    )

    // Sūta uz Montonio
    const montonioResp = await fetch('https://api.montonio.com/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: token }),
    })

    const order = await montonioResp.json()

    if (!montonioResp.ok || !order.payment_url) {
      console.error('Montonio kļūda:', order)
      return new Response(JSON.stringify({ error: 'Montonio neizdevās izveidot maksājumu', details: order }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      paymentUrl: order.payment_url,
      merchantRef,
      summa: summaEur,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('create-payment kļūda:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
