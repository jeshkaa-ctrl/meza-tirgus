// Montonio webhook — apstrādā maksājuma apstiprinājumus
// POST { orderToken: JWT } no Montonio IP: 35.156.245.42 / 35.156.159.169
// Montonio retry 48h ja atbilde nav 200/201

import { createHmac, timingSafeEqual } from 'crypto'

const SECRET_KEY = process.env.MONTONIO_SECRET_KEY
const SB_URL     = process.env.SUPABASE_URL || 'https://reuyrtiwzcxdknnmycev.supabase.co'
const SB_KEY     = process.env.SUPABASE_SERVICE_KEY

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function verifyJwt(token) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Nepareizs JWT formāts')
  const [header, body, sig] = parts
  const expected = b64url(createHmac('sha256', SECRET_KEY).update(`${header}.${body}`).digest())
  // timing-safe salīdzinājums — novērš timing uzbrukumus
  const eBuf = Buffer.from(expected)
  const sBuf = Buffer.from(sig)
  if (eBuf.length !== sBuf.length || !timingSafeEqual(eBuf, sBuf)) {
    throw new Error('Nepareizs JWT paraksts')
  }
  return JSON.parse(Buffer.from(body, 'base64url').toString())
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

async function sbUpsert(table, body, onConflict) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method:  'POST',
    headers: {
      'apikey':        SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        `resolution=merge-duplicates,return=minimal`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Supabase upsert ${table}: ${await res.text()}`)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
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

  // Tikai PAID apstrādājam — citi (PENDING, ABANDONED) tiek ignorēti bez kļūdas
  if (payload.paymentStatus !== 'PAID') {
    return res.status(200).json({ ok: true, skipped: payload.paymentStatus })
  }

  const ref = payload.merchantReference || ''
  console.log('Webhook PAID:', ref)

  try {
    if (ref.startsWith('PDF-')) {
      // PDF-{pdfTips}-{timestamp} → atrod ierakstu pēc merchant_ref un atzīmē kā apmaksātu
      await sbPatch('pdf_payments', `merchant_ref=eq.${encodeURIComponent(ref)}`, {
        apmaksats: true,
      })

    } else if (ref.startsWith('SUB-')) {
      // SUB-{planId}-{billingCycle}-{timestamp}
      // Daļa 4.2 — abonementa aktivizācija
      // Pagaidām tikai loģojam
      console.log('SUB webhook — Daļa 4.2 vēl nav implementēta:', ref)
    }
  } catch (e) {
    // Loģojam DB kļūdu bet VIENMĒR atgriežam 200 — lai Montonio neretrī
    console.error('Webhook DB kļūda:', e.message)
  }

  return res.status(200).json({ ok: true })
}
