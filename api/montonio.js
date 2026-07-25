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

async function sbGet(table, filter) {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${filter}&limit=1`, {
    headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return Array.isArray(data) ? (data[0] || null) : null
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

async function nosutitGuestApstiprinajumu(guestEmail, pdfTips) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !guestEmail) return
  const nosaukumi = {
    CIRSMA_SKICE:       'Cirsmas skice',
    CIRSMA_NOVERTESANA: 'Cirsmas novērtēšana',
    CAURMERA_MERIJUMI:  'Caurmēra mērījumi',
    DASTOJUMS:          'Dastojuma kalkulators',
    REKINS:             'Rēķins',
    KUBIKMETRI:         'Kubikmetru kalkulators',
  }
  const tips = nosaukumi[pdfTips] || 'PDF dokuments'
  const html = `<!DOCTYPE html><html lang="lv"><body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
<tr><td align="center"><table width="540" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="background:#2e7d32;padding:24px 32px"><div style="color:#fff;font-size:20px;font-weight:700">🌲 Meža Tirgus</div></td></tr>
<tr><td style="padding:32px">
<h2 style="margin:0 0 16px;color:#212529">Maksājums apstiprināts!</h2>
<p style="margin:0 0 16px;color:#495057;line-height:1.6">Jūsu <b>${tips}</b> PDF ir apmaksāts.</p>
<p style="margin:0 0 24px;color:#495057;line-height:1.6">
  Atgriezieties uz <a href="${APP_URL}" style="color:#2e7d32">meza-tirgus.lv</a> un noklikšķiniet PDF pogu —
  dokuments tiks ģenerēts uzreiz. Atļauja ir derīga 24 stundas no maksājuma brīža.
</p>
<p style="margin:0;font-size:13px;color:#6c757d">Jautājumi: <a href="mailto:mezatirgus.info@gmail.com" style="color:#2e7d32">mezatirgus.info@gmail.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`
  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      from:    'Meža Tirgus <onboarding@resend.dev>',
      to:      [guestEmail],
      subject: `${tips} — PDF maksājums apstiprināts`,
      html,
    }),
  }).catch(e => console.error('Resend kļūda:', e.message))
}

async function handleCheckout(req, res) {
  if (!ACCESS_KEY || !SECRET_KEY) return res.status(500).json({ error: 'Nav Montonio atslēgas' })
  if (!SB_KEY) return res.status(500).json({ error: 'Nav SUPABASE_SERVICE_KEY' })

  const { type, grandTotal, pdfTips, planId, billingCycle, userId, guestEmail } = req.body
  if (!grandTotal) return res.status(400).json({ error: 'Trūkst grandTotal' })

  const timestamp = Date.now()
  let merchantReference, returnUrl, notifDescription

  if (type === 'pdf') {
    if (!userId) return res.status(400).json({ error: 'Trūkst userId' })
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

  } else if (type === 'pdf_guest') {
    if (!guestEmail) return res.status(400).json({ error: 'Trūkst guestEmail' })
    if (!pdfTips) return res.status(400).json({ error: 'Trūkst pdfTips' })
    merchantReference = `PDF-${pdfTips}-${timestamp}`
    returnUrl         = `${APP_URL}/?payment=success&type=pdf`
    notifDescription  = 'PDF lejupielāde (viesis) — Meža Tirgus'

    await sbInsert('pdf_payments', {
      user_id:      null,
      guest_email:  guestEmail,
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
      // Ielādē ierakstu PIRMS PATCH — vajadzīgs guest_email e-pasta sūtīšanai
      const payment = await sbGet('pdf_payments', `merchant_ref=eq.${encodeURIComponent(ref)}&select=guest_email,pdf_tips`)
      await sbPatch('pdf_payments', `merchant_ref=eq.${encodeURIComponent(ref)}`, { apmaksats: true })
      // Viesa maksājums — sūta apstiprinājuma e-pastu
      if (payment?.guest_email) {
        await nosutitGuestApstiprinajumu(payment.guest_email, payment.pdf_tips)
      }
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
