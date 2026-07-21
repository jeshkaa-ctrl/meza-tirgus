// Montonio maksājuma sesijas izveide
// POST { type: 'pdf'|'sub', grandTotal, pdfTips?, planId?, billingCycle?, userId }
// Atgriež { paymentUrl, merchantReference }

import { createHmac } from 'crypto'

const ACCESS_KEY = process.env.MONTONIO_ACCESS_KEY
const SECRET_KEY = process.env.MONTONIO_SECRET_KEY
const APP_URL    = process.env.APP_URL || 'https://meza-tirgus.lv'
const SB_URL     = process.env.SUPABASE_URL || 'https://reuyrtiwzcxdknnmycev.supabase.co'
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY
const SANDBOX    = process.env.MONTONIO_SANDBOX === 'true'
const API_BASE   = SANDBOX
  ? 'https://sandbox-stargate.montonio.com/api'
  : 'https://stargate.montonio.com/api'

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function signJwt(payload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body   = b64url(JSON.stringify(payload))
  const sig    = b64url(createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest())
  return `${header}.${body}.${sig}`
}

async function sbInsert(table, row) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: {
      'apikey':        SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(row),
  })
  if (!res.ok) throw new Error(`Supabase insert ${table}: ${await res.text()}`)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!ACCESS_KEY || !SECRET_KEY) return res.status(500).json({ error: 'Nav Montonio atslēgas' })
  if (!SB_KEY) return res.status(500).json({ error: 'Nav SUPABASE_SERVICE_KEY' })

  const { type, grandTotal, pdfTips, planId, billingCycle, userId } = req.body

  if (!grandTotal || !userId) return res.status(400).json({ error: 'Trūkst grandTotal vai userId' })

  const timestamp = Date.now()
  let merchantReference, returnUrl, notifDescription

  if (type === 'pdf') {
    if (!pdfTips) return res.status(400).json({ error: 'Trūkst pdfTips' })
    merchantReference = `PDF-${pdfTips}-${timestamp}`
    returnUrl         = `${APP_URL}/?payment=success&type=pdf`
    notifDescription  = pdfTips === 'MAP' ? 'Meža plāna PDF — Meža Tirgus' : 'PDF lejupielāde — Meža Tirgus'

    // Pre-insert ieraksts — webhook to atzīmēs kā apmaksātu
    await sbInsert('pdf_payments', {
      user_id:      userId,
      merchant_ref: merchantReference,
      pdf_tips:     pdfTips,
      summa:        parseFloat(grandTotal),
    })

  } else if (type === 'sub') {
    if (!planId || !billingCycle) return res.status(400).json({ error: 'Trūkst planId vai billingCycle' })
    merchantReference = `SUB-${planId}-${billingCycle}-${timestamp}`
    returnUrl         = `${APP_URL}/?payment=success&plan=${planId}`
    notifDescription  = `Bizness abonements — Meža Tirgus`

  } else {
    return res.status(400).json({ error: 'Nezināms tips' })
  }

  const jwtPayload = {
    accessKey:       ACCESS_KEY,
    merchantReference,
    returnUrl,
    notificationUrl: `${APP_URL}/api/montonio-webhook`,
    grandTotal:      parseFloat(grandTotal),
    currency:        'EUR',
    exp:             Math.floor(Date.now() / 1000) + 600,
    payment: {
      method:   'paymentInitiation',
      amount:   parseFloat(grandTotal),
      currency: 'EUR',
      methodOptions: {
        preferredCountry:   'LV',
        preferredLocale:    'lv',
        paymentDescription: notifDescription,
      },
    },
    locale: 'lv',
  }

  try {
    const token = signJwt(jwtPayload)
    const resp  = await fetch(`${API_BASE}/orders`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data: token }),
    })

    const data = await resp.json()
    if (!resp.ok) return res.status(resp.status).json({ error: data.message || 'Montonio kļūda' })

    return res.status(200).json({ paymentUrl: data.paymentUrl, merchantReference, uuid: data.uuid })
  } catch (e) {
    return res.status(502).json({ error: e.message })
  }
}
