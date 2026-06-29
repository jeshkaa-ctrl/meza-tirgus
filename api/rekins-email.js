// Rēķina e-pasts klientam caur Resend
// Vercel env: RESEND_API_KEY, RESEND_FROM (piem. noreply@meza-tirgus.lv)
// POST { to, rekins: { nr, gads, datums, periods, apmaksa_termins,
//                       sniedzejs, sanemejs, rindas, pvn_rezims },
//         papildus_teksts? }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { to, rekins: r, papildus_teksts } = req.body
  if (!to || !r) return res.status(400).json({ error: 'Nav adresāta vai rēķina datu' })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY nav iestatīts' })

  const from = process.env.RESEND_FROM || 'onboarding@resend.dev'

  // ── Tabulas rindas ──────────────────────────────────────────────────────────
  const kopaa  = (r.rindas || []).reduce((s, l) => s + (l.summa || 0), 0)
  const pvn    = r.pvn_rezims === 'pvn21' ? kopaa * 0.21 : 0
  const kopa   = kopaa + pvn

  const rindasHTML = (r.rindas || []).map((l, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${i + 1}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${l.apraksts || '—'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${l.daudzums || ''} ${l.mervieniba || ''}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right">${parseFloat(l.cena || 0).toFixed(2)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">${(l.summa || 0).toFixed(2)}</td>
    </tr>`).join('')

  const pvnRinda = r.pvn_rezims === 'pvn21'
    ? `<tr><td colspan="4" style="padding:5px 10px;text-align:right;color:#6b7280">PVN 21%</td><td style="padding:5px 10px;text-align:right;color:#6b7280">${pvn.toFixed(2)}</td></tr>`
    : r.pvn_rezims === 'reversais'
    ? `<tr><td colspan="5" style="padding:5px 10px;font-style:italic;font-size:11px;color:#6b7280">Reversa PVN piemērošana saskaņā ar PVN likuma 142. pantu</td></tr>`
    : ''

  const papildsBloks = papildus_teksts?.trim()
    ? `<div style="margin:20px 0;padding:14px 16px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:4px;font-size:14px;color:#374151;line-height:1.6">${papildus_teksts.trim().replace(/\n/g, '<br/>')}</div>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="lv">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr><td style="background:#14532d;padding:24px 32px">
          <div style="color:#fff;font-size:20px;font-weight:700">🌲 Meža Tirgus</div>
          <div style="color:#86efac;font-size:12px;margin-top:2px">meza-tirgus.lv</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px 32px">
          <p style="margin:0 0 6px;font-size:15px;color:#111827">Labdien${r.sanemejs?.nosaukums ? `, <b>${r.sanemejs.nosaukums}</b>` : ''}!</p>
          <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6">
            Lūdzu apskatiet zemāk pievienoto rēķinu Nr. <b>${r.nr} - ${r.gads}</b>${r.periods ? ` par <b>${r.periods}</b>` : ''}.
          </p>

          <!-- Metadati -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
            <tr>
              <td style="width:50%;vertical-align:top;padding-right:12px">
                <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Rēķina Nr.</div>
                <div style="font-size:20px;font-weight:800;color:#14532d">${r.nr} - ${r.gads}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px">Datums: ${r.datums}</div>
              </td>
              <td style="width:50%;vertical-align:top;background:#fef9c3;border-radius:8px;padding:12px">
                <div style="font-size:11px;color:#854d0e;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Apmaksas termiņš</div>
                <div style="font-size:16px;font-weight:700;color:#92400e">${r.apmaksa_termins || '—'}</div>
              </td>
            </tr>
          </table>

          <!-- Pakalpojumi -->
          <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Pakalpojumi</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px;font-size:13px">
            <thead>
              <tr style="background:#f0fdf4">
                <th style="padding:8px 10px;text-align:left;font-size:11px;color:#374151;font-weight:600">Nr.</th>
                <th style="padding:8px 10px;text-align:left;font-size:11px;color:#374151;font-weight:600">Pakalpojums</th>
                <th style="padding:8px 10px;text-align:center;font-size:11px;color:#374151;font-weight:600">Daudzums</th>
                <th style="padding:8px 10px;text-align:right;font-size:11px;color:#374151;font-weight:600">Cena €</th>
                <th style="padding:8px 10px;text-align:right;font-size:11px;color:#374151;font-weight:600">Summa €</th>
              </tr>
            </thead>
            <tbody>${rindasHTML}</tbody>
            <tfoot>
              <tr style="background:#f9fafb"><td colspan="4" style="padding:8px 10px;text-align:right;font-size:13px;color:#374151">Kopā</td><td style="padding:8px 10px;text-align:right;font-weight:600">${kopaa.toFixed(2)}</td></tr>
              ${pvnRinda}
              <tr style="background:#f0fdf4"><td colspan="4" style="padding:10px 10px;text-align:right;font-weight:700;font-size:14px;color:#14532d">Kopā apmaksai</td><td style="padding:10px 10px;text-align:right;font-weight:800;font-size:16px;color:#14532d">${kopa.toFixed(2)} €</td></tr>
            </tfoot>
          </table>

          <!-- Bankas dati -->
          ${r.sniedzejs?.konts ? `<div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:20px;font-size:13px">
            <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Maksājuma rekvizīti</div>
            <div style="color:#374151"><b>${r.sniedzejs.nosaukums || ''}</b></div>
            ${r.sniedzejs.reg_nr || r.sniedzejs.regNr ? `<div style="color:#6b7280;font-size:12px">Reģ.Nr. ${r.sniedzejs.reg_nr || r.sniedzejs.regNr}</div>` : ''}
            <div style="margin-top:6px;color:#374151">Banka: ${r.sniedzejs.banka || '—'} &nbsp;|&nbsp; Konts: <b>${r.sniedzejs.konts}</b></div>
            ${r.sniedzejs.kods ? `<div style="color:#6b7280;font-size:12px">SWIFT: ${r.sniedzejs.kods}</div>` : ''}
            <div style="margin-top:6px;font-size:12px;color:#374151">Maksājuma mērķis: <b>Rēķins Nr. ${r.nr} - ${r.gads}</b></div>
          </div>` : ''}

          ${papildsBloks}

          <p style="margin:20px 0 0;font-size:14px;color:#374151;line-height:1.6">
            Jautājumu gadījumā sazinieties ar mums.<br/>
            <b>Ar cieņu,<br/>${r.sniedzejs?.nosaukums || 'Meža Tirgus'}</b>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center">
          <p style="margin:0;font-size:11px;color:#9ca3af">
            🌲 Rēķins sagatavots platformā <a href="https://meza-tirgus.lv" style="color:#14532d;text-decoration:none">Meža Tirgus</a>
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
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to:      [to],
        subject: `Rēķins Nr. ${r.nr} - ${r.gads} — ${r.sniedzejs?.nosaukums || 'Meža Tirgus'}`,
        html,
      }),
    })
    const data = await resp.json()
    if (!resp.ok) return res.status(resp.status).json({ error: data.message || 'Resend kļūda' })
    return res.status(200).json({ ok: true, id: data.id })
  } catch (e) {
    return res.status(502).json({ error: e.message })
  }
}
