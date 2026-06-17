import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { C, F, R, S, badge, btn, card, input } from './ds'

// ── LocalStorage atslēgas ────────────────────────────────────────────
const LS = {
  CJ_EMAIL:  'mt_bk_cj_email',
  CJ_PASS:   'mt_bk_cj_pass',
  MT_ADRESE: 'mt_bk_mt_adrese',
  POLLING:   'mt_bk_polling',
}

function lasitIestat() {
  return {
    cjEmail:  localStorage.getItem(LS.CJ_EMAIL)  || '',
    cjPass:   localStorage.getItem(LS.CJ_PASS)   || '',
    mtAdrese: localStorage.getItem(LS.MT_ADRESE) || 'Artijs Jēkabs, Ainaži, Latvija',
    polling:  localStorage.getItem(LS.POLLING) !== 'false',
  }
}

function dienasKopas(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function stundaMinute(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('lv-LV', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function urgencyKrasa(dienas) {
  if (dienas >= 3) return { bg: '#1a0808', border: '#5a1a1a', text: C.error,  icon: '🔴' }
  if (dienas >= 1) return { bg: '#1a1208', border: '#5a3a08', text: C.warn,   icon: '🟡' }
  return                   { bg: C.bgCard, border: C.greenBdr, text: C.textSec, icon: '🟢' }
}

// ── E-pasta sūtīšana caur /api/email (Resend) ───────────────────────
const sendTrackingEmail = async (order) => {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: order.email,
        customer_name: order.customer_name,
        product_name: order.product_name || 'Pasūtītā prece',
        order_id: order.id,
        tracking_code: order.tracking_code,
        delivery_days: '3-5',
      }),
    })
    const data = await response.json()
    if (data.success || data.ok) {
      await supabase
        .from('orders')
        .update({ email_sent: true })
        .eq('id', order.id)
      alert(`E-pasts nosūtīts uz ${order.email}`)
    } else {
      alert('E-pasta kļūda: ' + JSON.stringify(data.error))
    }
  } catch (err) {
    alert('Savienojuma kļūda: ' + err.message)
  }
}

// ── CJdropshipping caur Vercel proxy (/api/cj) ──────────────────────
async function cjFetch(path, opts = {}) {
  const resp = await fetch('/api/cj', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, ...opts }),
  })
  return resp.json()
}

// ── PDF (printēšana) ─────────────────────────────────────────────────
function drukātManualoSarakstu(orders, adrese) {
  const rindas = orders.map(o => {
    const d = dienasKopas(o.created_at)
    return `
      <tr style="border-bottom:1px solid #ddd">
        <td style="padding:8px">${d}d</td>
        <td style="padding:8px"><b>${o.product_name}</b><br><a href="${o.supplier_url || '#'}">${o.supplier_url || '—'}</a></td>
        <td style="padding:8px">${o.customer_name}<br><small>${o.customer_address || ''}</small></td>
        <td style="padding:8px">${o.quantity} × ?€</td>
        <td style="padding:8px">☐</td>
      </tr>`
  }).join('')
  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html><html><head><title>Manuālais saraksts</title>
    <style>body{font-family:Arial;font-size:13px;padding:20px} table{width:100%;border-collapse:collapse} th{background:#f0f0f0;padding:8px;text-align:left}</style>
    </head><body>
    <h2>Manuālais pasūtīšanas saraksts — ${new Date().toLocaleDateString('lv-LV')}</h2>
    <p>Piegādes adrese: <b>${adrese}</b></p>
    <table><thead><tr><th>Dienas</th><th>Produkts / Saite</th><th>Klients / Adrese</th><th>Daudzums</th><th>Pasūtīts ✓</th></tr></thead>
    <tbody>${rindas}</tbody></table>
    <script>window.print();window.close();</script></body></html>`)
  w.document.close()
}

// ── TrackingModal ─────────────────────────────────────────────────────
function TrackingModal({ order, iestat, onClose, onSaglabats }) {
  const [tracking, setTracking] = useState(order.tracking_code || '')
  const [carrier,  setCarrier]  = useState(order.tracking_carrier || '')
  const [glab,     setGlab]     = useState(false)
  const [suta,     setSuta]     = useState(false)
  const [kl,       setKl]       = useState(null)

  async function saglabat() {
    if (!tracking.trim()) return
    setGlab(true); setKl(null)
    try {
      await supabase.from('orders').update({
        tracking_code:    tracking.trim(),
        tracking_carrier: carrier.trim(),
        status:           'nosūtīts',
        shipped_at:       new Date().toISOString(),
      }).eq('id', order.id)

      if (order.customer_email || order.email) {
        setSuta(true)
        await sendTrackingEmail({
          ...order,
          email: order.customer_email || order.email,
          tracking_code: tracking.trim(),
        })
        setSuta(false)
      }

      onSaglabats()
      onClose()
    } catch (e) {
      setKl(e.message)
    } finally {
      setGlab(false); setSuta(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:C.overlay, zIndex:3000 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:C.bgCard, border:`1px solid ${C.greenBdrLt}`, borderRadius:R.xl,
        padding:28, zIndex:3001, width:420, boxShadow:'0 12px 48px rgba(0,0,0,0.5)',
        fontFamily:F.family,
      }}>
        <div style={{ fontSize:F.h3, fontWeight:700, color:C.text, marginBottom:4 }}>📦 Atzīmēt kā pasūtītu</div>
        <div style={{ fontSize:F.sm, color:C.textMut, marginBottom:20 }}>
          {order.customer_name} — {order.product_name}
        </div>
        <label style={{ fontSize:F.sm, color:C.textSec, display:'block', marginBottom:4 }}>Tracking kods *</label>
        <input
          value={tracking} onChange={e => setTracking(e.target.value)}
          placeholder="LV123456789EE"
          style={{ ...input.base, marginBottom:12 }}
          autoFocus
        />
        <label style={{ fontSize:F.sm, color:C.textSec, display:'block', marginBottom:4 }}>Pārvadātājs</label>
        <input
          value={carrier} onChange={e => setCarrier(e.target.value)}
          placeholder="Omniva, DPD, LP..."
          style={{ ...input.base, marginBottom:16 }}
        />
        {kl && <div style={{ color:C.error, fontSize:F.sm, marginBottom:12 }}>{kl}</div>}
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={btn.secondary}>Atcelt</button>
          <button onClick={saglabat} disabled={glab || !tracking.trim()} style={{
            ...btn.primary, opacity: !tracking.trim() ? 0.5 : 1,
          }}>
            {suta ? '📧 Sūta e-pastu...' : glab ? 'Saglabā...' : '✅ Apstiprināt'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Stats bloks ───────────────────────────────────────────────────────
function StatBloks({ ikona, virsraksts, vertiba, krasa }) {
  return (
    <div style={{
      ...card.base, flex:1, minWidth:140,
      borderColor: krasa + '44',
    }}>
      <div style={{ fontSize:22, marginBottom:4 }}>{ikona}</div>
      <div style={{ fontSize:F.h2, fontWeight:800, color: krasa || C.text, lineHeight:1 }}>{vertiba}</div>
      <div style={{ fontSize:F.xs, color:C.textMut, marginTop:4 }}>{virsraksts}</div>
    </div>
  )
}

// ── Iestatījumu cilne ─────────────────────────────────────────────────
function IestatijumiTab({ iestat, onSaglabat }) {
  const [f, setF] = useState(iestat)
  function inp(key) {
    return {
      value: f[key],
      onChange: e => setF(p => ({ ...p, [key]: e.target.value })),
      style: { ...input.base, marginBottom:12 },
    }
  }
  return (
    <div style={{ maxWidth:520 }}>
      <div style={{ ...card.base, marginBottom:16 }}>
        <div style={{ fontSize:F.base, fontWeight:700, color:C.textSec, marginBottom:12 }}>🤖 CJdropshipping API</div>
        <label style={{ fontSize:F.sm, color:C.textMut }}>E-pasts</label>
        <input {...inp('cjEmail')} type="email" placeholder="jūsu@epasts.lv" />
        <label style={{ fontSize:F.sm, color:C.textMut }}>Parole</label>
        <input {...inp('cjPass')} type="password" placeholder="••••••••" />
      </div>
      <div style={{ ...card.base, marginBottom:16, borderColor: C.info + '44' }}>
        <div style={{ fontSize:F.base, fontWeight:700, color:C.textSec, marginBottom:4 }}>📧 Resend (e-pasti)</div>
        <div style={{ fontSize:F.xs, color:C.textMut, marginBottom:12 }}>
          API atslēga jāiestata Vercel → Settings → Environment Variables →{' '}
          <code style={{ color:C.info }}>RESEND_API_KEY</code>.{' '}
          Bezmaksas: 100 e-pasti/dienā. <a href="https://resend.com" target="_blank" rel="noopener" style={{ color:C.info }}>resend.com ↗</a>
        </div>
        <div style={{ background:C.bgInner, borderRadius:R.md, padding:'10px 14px', fontSize:F.xs, color:C.textDim }}>
          ✓ Nav jākonfigurē frontendā — atslēga glabājas droši Vercel serverī
        </div>
      </div>
      <div style={{ ...card.base, marginBottom:16 }}>
        <div style={{ fontSize:F.base, fontWeight:700, color:C.textSec, marginBottom:12 }}>🏠 Meža Tirgus adrese</div>
        <label style={{ fontSize:F.sm, color:C.textMut }}>Manuālo pasūtījumu piegādes adrese</label>
        <input {...inp('mtAdrese')} placeholder="Vārds Uzvārds, Iela, Pilsēta" />
      </div>
      <div style={{ ...card.base, marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:F.base, fontWeight:700, color:C.textSec }}>⏱ Auto-polling</div>
          <div style={{ fontSize:F.sm, color:C.textMut, marginTop:2 }}>Pārbauda jaunus pasūtījumus ik 60 sek</div>
        </div>
        <button
          onClick={() => setF(p => ({ ...p, polling: !p.polling }))}
          style={{
            ...btn.small,
            background: f.polling ? C.greenDk : C.bgInner,
            color: f.polling ? C.green : C.textMut,
            border: `1px solid ${f.polling ? C.green : C.greenBdr}`,
          }}
        >{f.polling ? '● Ieslēgts' : '○ Izslēgts'}</button>
      </div>
      <button onClick={() => onSaglabat(f)} style={{ ...btn.primary, width:'100%' }}>
        💾 Saglabāt iestatījumus
      </button>
    </div>
  )
}

// ── Galvenais komponents ──────────────────────────────────────────────
export default function BotsBankieris() {
  const [cilne,     setCilne]     = useState('manualie')
  const [orders,    setOrders]    = useState([])
  const [ielades,   setIelades]   = useState(true)
  const [pednums,   setPednums]   = useState(null)  // tracking modal
  const [autoLog,   setAutoLog]   = useState([])
  const [iestat,    setIestat]    = useState(lasitIestat)
  const [saglabMsg, setSaglabMsg] = useState(null)
  const pollingRef = useRef(null)

  // ── Supabase fetch ──
  const atjauninat = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error && data) setOrders(data)
    setIelades(false)
  }, [])

  useEffect(() => { atjauninat() }, [atjauninat])

  // ── Polling ──
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    if (!iestat.polling) return
    pollingRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'jauns')
        .order('created_at', { ascending: true })
        .limit(50)
      if (!data?.length) return
      setOrders(prev => {
        const ids = new Set(prev.map(o => o.id))
        const jaunie = data.filter(o => !ids.has(o.id))
        if (jaunie.length) {
          setAutoLog(l => [`${new Date().toLocaleTimeString('lv-LV')}: ${jaunie.length} jauni pasūtījumi`, ...l.slice(0, 49)])
          return [...jaunie, ...prev]
        }
        return prev
      })
      // auto pasūtīšana CJ
      for (const ord of data) {
        if ((ord.fulfillment_type || 'manual') === 'auto' && !ord.cj_order_id) {
          await apstradetAutoPassutijumu(ord)
        }
      }
    }, 60000)
    return () => clearInterval(pollingRef.current)
  }, [iestat.polling]) // eslint-disable-line

  // ── CJ auto apstrāde ──
  async function apstradetAutoPassutijumu(ord) {
    try {
      const res = await cjFetch('/order/create', {
        cjEmail: iestat.cjEmail,
        cjPass:  iestat.cjPass,
        order:   ord,
      })
      if (res.cjOrderId) {
        await supabase.from('orders').update({
          cj_order_id: res.cjOrderId,
          status:      'apstrādē',
          ordered_at:  new Date().toISOString(),
        }).eq('id', ord.id)
        setAutoLog(l => [`${new Date().toLocaleTimeString('lv-LV')}: CJ pasūtījums izveidots — ${ord.id}`, ...l.slice(0, 49)])
        setOrders(prev => prev.map(o => o.id === ord.id ? { ...o, cj_order_id: res.cjOrderId, status: 'apstrādē' } : o))
      }
    } catch (e) {
      setAutoLog(l => [`${new Date().toLocaleTimeString('lv-LV')}: CJ kļūda — ${e.message}`, ...l.slice(0, 49)])
    }
  }

  // ── Stats ──
  const sdiena = new Date().toISOString().slice(0, 10)
  const smeness = new Date().toISOString().slice(0, 7)
  const jaunie   = orders.filter(o => o.status === 'jauns')
  const manGaida = orders.filter(o => o.status === 'jauns' && (o.fulfillment_type || 'manual') === 'manual')
  const autoSodien = orders.filter(o => (o.fulfillment_type || 'manual') === 'auto' && o.ordered_at?.startsWith(sdiena))
  const pelna = orders
    .filter(o => o.created_at?.startsWith(smeness))
    .reduce((s, o) => s + (parseFloat(o.price_total) || 0), 0)

  // ── Iestatījumu saglabāšana ──
  function saglabatIestat(jaunieIestat) {
    localStorage.setItem(LS.CJ_EMAIL,  jaunieIestat.cjEmail)
    localStorage.setItem(LS.CJ_PASS,   jaunieIestat.cjPass)
    localStorage.setItem(LS.MT_ADRESE, jaunieIestat.mtAdrese)
    localStorage.setItem(LS.POLLING,   jaunieIestat.polling)
    setIestat(jaunieIestat)
    setSaglabMsg('Saglabāts!')
    setTimeout(() => setSaglabMsg(null), 2500)
  }

  // ── Filtrētie saraksti ──
  const manualie = orders.filter(o =>
    (o.fulfillment_type || 'manual') === 'manual' && o.status === 'jauns'
  ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const automatiskie = orders.filter(o => (o.fulfillment_type || 'manual') === 'auto')

  const CILNES = [
    { id: 'manualie',    label: `⚡ Manuālais saraksts${manGaida.length ? ` (${manGaida.length})` : ''}` },
    { id: 'automatiskie',label: '🤖 Automātiskie' },
    { id: 'visi',        label: '📋 Visi pasūtījumi' },
    { id: 'iestatijumi', label: '⚙️ Iestatījumi' },
  ]

  return (
    <div style={{ fontFamily:F.family, color:C.text, minHeight:'100vh' }}>

      {/* Stats */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:24 }}>
        <StatBloks ikona="🆕" virsraksts="Jauni pasūtījumi"       vertiba={jaunie.length}      krasa={jaunie.length    ? C.warn : C.textMut} />
        <StatBloks ikona="⚡" virsraksts="Gaida manuālu pasūt."   vertiba={manGaida.length}    krasa={manGaida.length  ? C.error : C.textMut} />
        <StatBloks ikona="🤖" virsraksts="Auto apstrādāti šodien" vertiba={autoSodien.length}   krasa={C.info} />
        <StatBloks ikona="💶" virsraksts="Apgrozījums mēnesī"      vertiba={`${pelna.toFixed(2)}€`} krasa={C.success} />
      </div>

      {/* Polling statuss */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
        <div style={{
          width:8, height:8, borderRadius:'50%',
          background: iestat.polling ? C.success : C.textDim,
          boxShadow: iestat.polling ? `0 0 6px ${C.success}` : 'none',
        }} />
        <span style={{ fontSize:F.xs, color:C.textDim }}>
          {iestat.polling ? 'Polling aktīvs — pārbauda ik 60 sek' : 'Polling izslēgts'}
        </span>
        {saglabMsg && <span style={{ fontSize:F.xs, color:C.success, marginLeft:'auto' }}>✓ {saglabMsg}</span>}
      </div>

      {/* Cilnes */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.greenBdr}`, marginBottom:20 }}>
        {CILNES.map(c => (
          <button key={c.id} onClick={() => setCilne(c.id)} style={{
            background:'none', border:'none',
            borderBottom: cilne === c.id ? `2px solid ${C.green}` : '2px solid transparent',
            color: cilne === c.id ? C.green : C.textMut,
            padding:'10px 16px', fontSize:F.sm, fontWeight: cilne === c.id ? 700 : 400,
            cursor:'pointer', fontFamily:F.family, whiteSpace:'nowrap',
          }}>{c.label}</button>
        ))}
      </div>

      {ielades && <div style={{ textAlign:'center', padding:60, color:C.textDim }}>Ielādē...</div>}

      {/* ── MANUĀLAIS SARAKSTS ── */}
      {!ielades && cilne === 'manualie' && (
        <div>
          {manualie.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:C.textDim }}>
              <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
              Manuālais saraksts tukšs — visi pasūtījumi apstrādāti
            </div>
          ) : (
            <>
              {manualie.map(ord => {
                const d = dienasKopas(ord.created_at)
                const u = urgencyKrasa(d)
                return (
                  <div key={ord.id} style={{
                    background: u.bg,
                    border: `1px solid ${u.border}`,
                    borderRadius: R.lg,
                    padding:16,
                    marginBottom:10,
                    display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap',
                  }}>
                    {/* Termiņš */}
                    <div style={{ minWidth:52, textAlign:'center' }}>
                      <div style={{ fontSize:20 }}>{u.icon}</div>
                      <div style={{ fontSize:F.xs, color:u.text, fontWeight:700 }}>{d}d</div>
                    </div>

                    {/* Produkts */}
                    <div style={{ flex:2, minWidth:160 }}>
                      <div style={{ fontSize:F.base, fontWeight:700, color:C.text }}>{ord.product_name}</div>
                      <div style={{ fontSize:F.xs, color:C.textMut, marginTop:2 }}>#{ord.id?.slice(0,8)}</div>
                      {ord.supplier_url && (
                        <a href={ord.supplier_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize:F.xs, color:C.info, textDecoration:'none', display:'block', marginTop:2 }}>
                          🔗 Pārdevēja lapa ↗
                        </a>
                      )}
                    </div>

                    {/* Klients */}
                    <div style={{ flex:2, minWidth:160 }}>
                      <div style={{ fontSize:F.sm, fontWeight:600, color:C.textSec }}>{ord.customer_name}</div>
                      <div style={{ fontSize:F.xs, color:C.textMut, marginTop:2 }}>
                        {ord.customer_address || ord.customer_phone || '—'}
                      </div>
                      <div style={{ fontSize:F.xs, color:C.textDim }}>{ord.customer_email}</div>
                    </div>

                    {/* Summa */}
                    <div style={{ minWidth:80, textAlign:'right' }}>
                      <div style={{ fontSize:F.base, fontWeight:700, color:C.text }}>{ord.price_total}€</div>
                      <div style={{ fontSize:F.xs, color:C.textMut }}>× {ord.quantity}</div>
                      <div style={{ fontSize:F.xs, color:C.textDim, marginTop:2 }}>{stundaMinute(ord.created_at)}</div>
                    </div>

                    {/* Pogas */}
                    <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:140 }}>
                      <button onClick={() => setPednums(ord)} style={{ ...btn.primary, fontSize:F.xs, padding:'7px 12px', minHeight:32 }}>
                        ✅ Atzīmēt kā pasūtītu
                      </button>
                      {ord.supplier_url && (
                        <button onClick={() => window.open(ord.supplier_url, '_blank', 'noopener')}
                          style={{ ...btn.small, fontSize:F.xs }}>
                          🛒 Atvērt saiti
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Kopsavilkums */}
              <div style={{
                ...card.base, marginTop:16,
                display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12,
              }}>
                <div style={{ fontSize:F.sm, color:C.textSec }}>
                  ⚡ Jāpasūta <b>{manualie.length}</b> prece(s) &mdash; kopā{' '}
                  <b>{manualie.reduce((s, o) => s + (parseFloat(o.price_total) || 0), 0).toFixed(2)}€</b>{' '}
                  pārdošanas summa
                </div>
                <button onClick={() => drukātManualoSarakstu(manualie, iestat.mtAdrese)}
                  style={{ ...btn.secondary, fontSize:F.sm, padding:'7px 14px', minHeight:34 }}>
                  🖨️ Eksportēt PDF
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── AUTOMĀTISKIE ── */}
      {!ielades && cilne === 'automatiskie' && (
        <div>
          <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center' }}>
            <div style={{ fontSize:F.sm, color:C.textMut }}>
              CJ pasūtījumi (auto fulfillment). Lai produkts tiktu apstrādāts automātiski, iestatiet{' '}
              <code style={{ color:C.info }}>fulfillment_type = 'auto'</code> Supabase.
            </div>
          </div>
          {automatiskie.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:C.textDim }}>Nav automātisko pasūtījumu</div>
          ) : automatiskie.map(ord => (
            <div key={ord.id} style={{ ...card.base, marginBottom:8, display:'flex', gap:16, flexWrap:'wrap' }}>
              <div style={{ flex:2 }}>
                <div style={{ fontSize:F.base, fontWeight:700, color:C.text }}>{ord.product_name}</div>
                <div style={{ fontSize:F.xs, color:C.textMut }}>#{ord.id?.slice(0,8)} · {ord.customer_name}</div>
              </div>
              <div>
                {ord.cj_order_id
                  ? <span style={badge.blue}>CJ: {ord.cj_order_id}</span>
                  : <span style={badge.orange}>Gaida CJ</span>}
              </div>
              <div>
                {ord.tracking_code
                  ? <span style={badge.green}>{ord.tracking_code}</span>
                  : <span style={{ color:C.textDim, fontSize:F.xs }}>nav tracking</span>}
              </div>
              <div style={{ fontSize:F.xs, color:C.textDim }}>{stundaMinute(ord.ordered_at || ord.created_at)}</div>
            </div>
          ))}

          {/* Auto logs */}
          {autoLog.length > 0 && (
            <div style={{ ...card.base, marginTop:20 }}>
              <div style={{ fontSize:F.sm, fontWeight:700, color:C.textSec, marginBottom:8 }}>📋 Darbību žurnāls</div>
              {autoLog.map((l, i) => (
                <div key={i} style={{ fontSize:F.xs, color:C.textDim, fontFamily:'monospace', lineHeight:1.8 }}>{l}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VISI PASŪTĪJUMI ── */}
      {!ielades && cilne === 'visi' && (
        <div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:F.sm }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.greenBdr}` }}>
                  {['#','Datums','Klients','Produkts','Summa','Veids','Statuss','Tracking'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', color:C.textMut, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => {
                  const statusKrasa = {
                    jauns:'#42a5f5', apstrādē:C.warn, nosūtīts:'#ab47bc', piegādāts:C.success
                  }[ord.status] || C.textMut
                  return (
                    <tr key={ord.id} style={{ borderBottom:`1px solid ${C.greenBdr}22` }}
                      onMouseEnter={e => e.currentTarget.style.background=C.bgInner}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding:'8px 10px', color:C.textDim, fontFamily:'monospace' }}>{ord.id?.slice(0,8)}</td>
                      <td style={{ padding:'8px 10px', color:C.textMut, whiteSpace:'nowrap' }}>{stundaMinute(ord.created_at)}</td>
                      <td style={{ padding:'8px 10px', color:C.textSec }}>{ord.customer_name}</td>
                      <td style={{ padding:'8px 10px', color:C.text }}>{ord.product_name}</td>
                      <td style={{ padding:'8px 10px', color:C.text, fontWeight:700 }}>{ord.price_total}€</td>
                      <td style={{ padding:'8px 10px' }}>
                        <span style={(ord.fulfillment_type||'manual')==='auto' ? badge.blue : badge.orange}>
                          {(ord.fulfillment_type||'manual')==='auto' ? 'auto' : 'manuāls'}
                        </span>
                      </td>
                      <td style={{ padding:'8px 10px' }}>
                        <span style={{ color:statusKrasa, fontWeight:600, fontSize:F.xs }}>{ord.status}</span>
                      </td>
                      <td style={{ padding:'8px 10px', color:C.textDim, fontFamily:'monospace', fontSize:F.xs }}>
                        {ord.tracking_code || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:F.xs, color:C.textDim, marginTop:12 }}>{orders.length} pasūtījumi kopā</div>
        </div>
      )}

      {/* ── IESTATĪJUMI ── */}
      {!ielades && cilne === 'iestatijumi' && (
        <IestatijumiTab iestat={iestat} onSaglabat={saglabatIestat} />
      )}

      {/* ── Tracking modālis ── */}
      {pednums && (
        <TrackingModal
          order={pednums}
          iestat={iestat}
          onClose={() => setPednums(null)}
          onSaglabats={() => { setPednums(null); atjauninat() }}
        />
      )}
    </div>
  )
}
