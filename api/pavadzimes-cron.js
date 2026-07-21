// Pavadzīmju limitu uzraudzība — Vercel Cron (katru dienu 06:00 UTC)
// Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://reuyrtiwzcxdknnmycev.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY
const RESEND_KEY   = process.env.RESEND_API_KEY

const LIMITS = { sakuma: 50, videjais: 150 } // neierobezots — nav limita
const BIZNESS_PLAN_IDS = ['business_sakuma', 'business_videjais', 'business_neierobezots', 'business']

const PLAN_TO_PAKAPE = {
  business_sakuma:       'sakuma',
  business_videjais:     'videjais',
  business_neierobezots: 'neierobezots',
  business:              'videjais',
}

// ── Supabase REST palīgs ─────────────────────────────────────────────────────

async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey':        SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`GET ${path}: ${await res.text()}`)
  return res.json()
}

async function sbPatch(table, filter, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method:  'PATCH',
    headers: {
      'apikey':        SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PATCH ${table}: ${await res.text()}`)
}

async function getUserEmail(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
  })
  if (!res.ok) return null
  const u = await res.json()
  return u.email || null
}

// ── Resend e-pasts ───────────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Meža Tirgus <onboarding@resend.dev>',
        to:   [to],
        subject,
        html,
      }),
    })
    return res.ok
  } catch { return false }
}

function html80(pakapeNos, skaits, limits) {
  const atlikusi = limits - skaits
  return `<!DOCTYPE html><html lang="lv"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
<tr><td style="background:#2e7d32;padding:28px 32px">
  <div style="color:#fff;font-size:22px;font-weight:700">🌲 Meža Tirgus</div>
  <div style="color:#a5d6a7;font-size:13px;margin-top:4px">meza-tirgus.lv</div>
</td></tr>
<tr><td style="padding:32px">
  <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#212529">📊 Pavadzīmju limits — 80%</p>
  <p style="margin:0 0 24px;font-size:14px;color:#495057;line-height:1.6">
    Šomēnes esat augšupielādējis <b>${skaits}</b> no <b>${limits}</b> pavadzīmēm
    (plāns: <b>${pakapeNos}</b>). Atlikušas <b>${atlikusi}</b>.
  </p>
  <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px 20px;margin-bottom:24px">
    <p style="margin:0;font-size:13px;color:#795548;line-height:1.6">
      Ja mēneša laikā sasniegsiet limitu, saņemsiet vēl vienu paziņojumu.
      Augšupielāde netiek bloķēta — bet apsveriet pāreju uz nākamo plāna pakāpi,
      ja paredzat lielāku apjomu.
    </p>
  </div>
  <a href="https://meza-tirgus.lv/?page=main" style="display:inline-block;padding:12px 24px;background:#2e7d32;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Skatīt abonementa opcijas →</a>
</td></tr>
<tr><td style="background:#f8f9fa;padding:16px 32px;border-top:1px solid #e9ecef">
  <p style="margin:0;font-size:11px;color:#adb5bd;text-align:center">
    © ${new Date().getFullYear()} Meža Tirgus · Latvija ·
    <a href="https://meza-tirgus.lv" style="color:#adb5bd">meza-tirgus.lv</a>
  </p>
</td></tr>
</table></td></tr></table>
</body></html>`
}

function html100(pakapeNos, skaits, limits, nakamaPakape) {
  return `<!DOCTYPE html><html lang="lv"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
<tr><td style="background:#b71c1c;padding:28px 32px">
  <div style="color:#fff;font-size:22px;font-weight:700">🌲 Meža Tirgus</div>
  <div style="color:#ef9a9a;font-size:13px;margin-top:4px">meza-tirgus.lv</div>
</td></tr>
<tr><td style="padding:32px">
  <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#212529">⚠️ Pavadzīmju limits sasniegts</p>
  <p style="margin:0 0 24px;font-size:14px;color:#495057;line-height:1.6">
    Šomēnes esat augšupielādējis <b>${skaits}</b> pavadzīmes — tas sasniedz
    plāna <b>${pakapeNos}</b> limitu (<b>${limits}</b>/mēn).
    Augšupielāde <b>netiek bloķēta</b> tekošajā mēnesī.
  </p>
  <div style="background:#fce4ec;border:1px solid #f48fb1;border-radius:8px;padding:16px 20px;margin-bottom:24px">
    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#b71c1c">Ieteicamā darbība</p>
    <p style="margin:0;font-size:13px;color:#795548;line-height:1.6">
      Apsveriet pāreju uz <b>${nakamaPakape}</b> plānu, sākot ar nākamo mēnesi,
      lai izvairītos no šī ierobežojuma.
    </p>
  </div>
  <a href="https://meza-tirgus.lv/?page=main" style="display:inline-block;padding:12px 24px;background:#2e7d32;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">Pāriet uz augstāku plānu →</a>
</td></tr>
<tr><td style="background:#f8f9fa;padding:16px 32px;border-top:1px solid #e9ecef">
  <p style="margin:0;font-size:11px;color:#adb5bd;text-align:center">
    © ${new Date().getFullYear()} Meža Tirgus · Latvija ·
    <a href="https://meza-tirgus.lv" style="color:#adb5bd">meza-tirgus.lv</a>
  </p>
</td></tr>
</table></td></tr></table>
</body></html>`
}

// ── Galvenais handler ────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (!SERVICE_KEY) return res.status(500).json({ error: 'Nav SUPABASE_SERVICE_KEY' })
  if (!RESEND_KEY)  return res.status(500).json({ error: 'Nav RESEND_API_KEY' })

  const tagad = new Date()
  const menesaSakums = `${tagad.getFullYear()}-${String(tagad.getMonth() + 1).padStart(2, '0')}-01`

  let atjauninati = 0, emaili80 = 0, emaili100 = 0, kļudas = []

  try {
    // 1. Visas aktīvās Bizness abonēšanas
    const planIdFilter = BIZNESS_PLAN_IDS.map(p => `"${p}"`).join(',')
    const subs = await sbGet(
      `subscriptions?plan_id=in.(${BIZNESS_PLAN_IDS.join(',')})&status=eq.active&select=user_id,plan_id`
    )

    for (const sub of subs) {
      const { user_id, plan_id } = sub
      const pakape = PLAN_TO_PAKAPE[plan_id] || 'videjais'

      // Neierobežotam nav limita — izlaiž
      if (pakape === 'neierobezots') continue

      const limits = LIMITS[pakape]

      try {
        // 2. Iegūst lietotaju_abonementi ierakstu
        const aboRows = await sbGet(`lietotaju_abonementi?user_id=eq.${user_id}&select=*`)
        const abo = aboRows[0]
        if (!abo) continue // nav nevienas pavadzīmes šomēnes

        // 3. Mēnesis mainījies — atiestata
        const pedejaisD = abo.pedejais_atiestatisanas_datums
        if (!pedejaisD || pedejaisD < menesaSakums) {
          await sbPatch('lietotaju_abonementi', `user_id=eq.${user_id}`, {
            pavadzimes_menesi:              0,
            brinajums_80_nosutits:          false,
            brinajums_100_nosutits:         false,
            pedejais_atiestatisanas_datums: menesaSakums,
            abonementa_pakape:              pakape,
          })
          atjauninati++
          continue
        }

        // Sinhronizē pakāpi ja mainījusies
        if (abo.abonementa_pakape !== pakape) {
          await sbPatch('lietotaju_abonementi', `user_id=eq.${user_id}`, { abonementa_pakape: pakape })
        }

        const skaits    = abo.pavadzimes_menesi || 0
        const procenti  = (skaits / limits) * 100
        const pakapeNos = pakape === 'sakuma' ? 'Sākuma 50/mēn' : 'Vidējais 150/mēn'

        // 4. 100% — limits sasniegts
        if (procenti >= 100 && !abo.brinajums_100_nosutits) {
          const epasts = await getUserEmail(user_id)
          if (!epasts) continue
          const nakamaPakape = pakape === 'sakuma' ? 'Vidējais (150/mēn — €45)' : 'Neierobežots (€69)'
          const ok = await sendEmail(
            epasts,
            '⚠️ Pavadzīmju limits sasniegts — Meža Tirgus',
            html100(pakapeNos, skaits, limits, nakamaPakape)
          )
          if (ok) {
            await sbPatch('lietotaju_abonementi', `user_id=eq.${user_id}`, { brinajums_100_nosutits: true })
            emaili100++
          }
        }
        // 5. 80% — atgādinājums (tikai ja 100% paziņojums vēl nav sūtīts)
        else if (procenti >= 80 && !abo.brinajums_80_nosutits) {
          const epasts = await getUserEmail(user_id)
          if (!epasts) continue
          const ok = await sendEmail(
            epasts,
            '📊 Pavadzīmju limits 80% — Meža Tirgus',
            html80(pakapeNos, skaits, limits)
          )
          if (ok) {
            await sbPatch('lietotaju_abonementi', `user_id=eq.${user_id}`, { brinajums_80_nosutits: true })
            emaili80++
          }
        }
      } catch (err) {
        kļudas.push(`${user_id}: ${err.message}`)
      }
    }
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }

  return res.status(200).json({ ok: true, atjauninati, emaili80, emaili100, kļudas })
}
