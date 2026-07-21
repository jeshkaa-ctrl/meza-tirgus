// api/montonio.js — Montonio checkout + webhook apvienots
// Routing: req.body.orderToken klāt → webhook; citādi → checkout
// POST { type, grandTotal, pdfTips?, planId?, billingCycle?, userId } → checkout
// POST { orderToken: JWT } no Montonio → webhook

import { createHmac, timingSafeEqual } from 'crypto'

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

function verifyJwt(token) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Nepareizs JWT formāts')
  const [header, body, sig] = parts
  const expected = b64url(createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest())
  const eBuf = Buffer.from(expected)
  const sBuf = Buffer.from(sig)
  if (eBuf.length !== sBuf.length || !timingSafeEqual(eBuf, sBuf)) {
    throw new Error('Nepareizs JWT paraksts')
  }
  return JSON.parse(Buffer.from(body, 'base64url').toString())
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

async function sbPatch(table, filter, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method:  'PATCH',
    headers: {
      'apikey':        SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase PATCH ${table}: ${await res.text()}`)
}

async function handleCheckout(req, res) {
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
    notificationUrl: `${APP_URL}/api/montonio`,
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

async function handleWebhook(req, res) {
  if (!SECRET_KEY || !SB_KEY) {
    console.error('Webhook: nav atslēgu')
    return res.status(500).json({ error: 'Nav atslēgu' })
  }

  const { orderToken } = req.body
  if (!orderToken) return res.status(400).json({ error: 'Nav orderToken' })

  let payload
  try {
    payload = verifyJwt(orderToken)
  } catch (e) {
    console.error('Webhook JWT kļūda:', e.message)
    return res.status(401).json({ error: 'Nepareizs paraksts' })
  }

  if (payload.paymentStatus !== 'PAID') {
    return res.status(200).json({ ok: true, skipped: payload.paymentStatus })
  }

  const ref = payload.merchantReference || ''
  console.log('Webhook PAID:', ref)

  try {
    if (ref.startsWith('PDF-')) {
      await sbPatch('pdf_payments', `merchant_ref=eq.${encodeURIComponent(ref)}`, { apmaksats: true })
    } else if (ref.startsWith('SUB-')) {
      console.log('SUB webhook — Daļa 4.2 vēl nav implementēta:', ref)
    }
  } catch (e) {
    console.error('Webhook DB kļūda:', e.message)
  }

  return res.status(200).json({ ok: true })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Webhook: Montonio sūta orderToken; checkout sūta type/grandTotal/userId
  if (req.body?.orderToken) return handleWebhook(req, res)
  return handleCheckout(req, res)
}
