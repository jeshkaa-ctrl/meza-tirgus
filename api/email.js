// Resend e-pasta sūtīšana
// Vercel env: RESEND_API_KEY
// POST { to, customer_name, product_name, order_id, delivery_days, tracking_code }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    to,
    customer_name,
    product_name,
    order_id,
    delivery_days = '3–7',
    tracking_code,
    summa_eur,
  } = req.body

  if (!to) return res.status(400).json({ error: 'Nav e-pasta adreses' })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY nav iestatīts Vercel' })

  const trackingRinda = tracking_code
    ? `<p><b>Tracking kods:</b> <code style="background:#f4f4f4;padding:2px 6px;border-radius:4px">${tracking_code}</code></p>`
    : `<p><b>Tracking kods:</b> tiks nosūtīts, tiklīdz prece tiks nodota pārvadātājam.</p>`

  const html = `
<!DOCTYPE html>
<html lang="lv">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr><td style="background:#2e7d32;padding:28px 32px">
          <div style="color:#ffffff;font-size:22px;font-weight:700">🌲 Meža Tirgus</div>
          <div style="color:#a5d6a7;font-size:13px;margin-top:4px">meza-tirgus.lv</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px">
          <p style="margin:0 0 16px;font-size:16px;color:#212529">Labdien, <b>${customer_name}</b>!</p>
          <p style="margin:0 0 24px;font-size:14px;color:#495057;line-height:1.6">
            Jūsu pasūtījums ir saņemts un apstiprināts. Paldies, ka izvēlējāties Meža Tirgus!
          </p>

          <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6c757d;text-transform:uppercase;letter-spacing:0.5px">Pasūtījuma detaļas</p>
            <p style="margin:0 0 6px;font-size:14px;color:#212529"><b>Prece:</b> ${product_name}</p>
            <p style="margin:0 0 6px;font-size:14px;color:#212529"><b>Pasūtījuma Nr.:</b> #${order_id}</p>
            <p style="margin:0 0 6px;font-size:14px;color:#212529"><b>Paredzamais piegādes laiks:</b> ${delivery_days} dienas</p>
            ${trackingRinda}
          </div>

          <p style="margin:0;font-size:13px;color:#6c757d;line-height:1.6">
            Ja jums ir jautājumi par pasūtījumu, sazinieties ar mums:<br>
            <a href="mailto:info@meza-tirgus.lv" style="color:#2e7d32">info@meza-tirgus.lv</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8f9fa;padding:16px 32px;border-top:1px solid #e9ecef">
          <p style="margin:0;font-size:11px;color:#adb5bd;text-align:center">
            © ${new Date().getFullYear()} Meža Tirgus · Latvija ·
            <a href="https://meza-tirgus.lv" style="color:#adb5bd">meza-tirgus.lv</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    'Meža Tirgus <onboarding@resend.dev>',
        to:      [to],
        subject: `Jūsu pasūtījums #${order_id} ir apstiprināts — Meža Tirgus`,
        html,
      }),
    })

    const data = await resp.json()
    if (!resp.ok) return res.status(resp.status).json({ error: data.message || 'Resend kļūda' })

    // Automātiski ierakstīt grāmatvedībā ja summa nodota
    if (summa_eur && process.env.SUPABASE_SERVICE_KEY) {
      const sbUrl = process.env.SUPABASE_URL || 'https://reuyrtiwzcxdknnmycev.supabase.co'
      const summa = parseFloat(summa_eur) || 0
      const pvn   = +(summa / 1.21 * 0.21).toFixed(2)
      const kat   = (product_name || '').toLowerCase().includes('abonem')
        ? 'abonements_menesis'
        : 'dropshipping_prece'
      await fetch(`${sbUrl}/rest/v1/gramatvedis_darijumi`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({
          datums:        new Date().toISOString().slice(0, 10),
          veids:         'ienemums',
          summa_eur:     summa,
          pvn_eur:       pvn,
          summa_bez_pvn: +(summa / 1.21).toFixed(2),
          kategorija:    kat,
          apraksts:      `${product_name || 'Pasūtījums'} — ${customer_name || ''}`,
          avots:         'montonio',
          rekina_nr:     String(order_id || ''),
        }),
      }).catch(() => {}) // nekad nebloķē e-pasta atbildi
    }

    return res.status(200).json({ ok: true, id: data.id })
  } catch (e) {
    return res.status(502).json({ error: e.message })
  }
}
