import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { useGroza } from './hooks/useGroza'
import { OMNIVA_PAKOMATI } from './omnivaData'
import { DPD_PAKOMATI } from './dpdData'
import { LP_PAKOMATI } from './lpData'

const ADMIN_EMAIL = 'jeshkaa@inbox.lv'
const ADMIN_PIN   = '2509'

function PinModal({ onConfirm, onClose }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)
  const ref = useRef(null)
  useEffect(() => { ref.current?.focus() }, [])

  function check() {
    if (pin === ADMIN_PIN) { onConfirm(); onClose() }
    else { setErr(true); setPin('') }
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:2000 }} />
      <div style={{
        position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        background:'#fff', borderRadius:14, padding:'28px 32px', zIndex:2001,
        width:300, boxShadow:'0 8px 40px rgba(0,0,0,0.18)', fontFamily:L.font,
      }}>
        <div style={{ fontSize:15, fontWeight:700, color:L.text, marginBottom:6 }}>🔐 Admin PIN</div>
        <div style={{ fontSize:13, color:L.textMut, marginBottom:16 }}>Ievadi PIN kodu lai turpinātu</div>
        <input
          ref={ref}
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="• • • •"
          style={{
            width:'100%', padding:'10px 14px', fontSize:18, letterSpacing:8,
            border:`2px solid ${err ? '#dc3545' : L.border}`, borderRadius:8,
            outline:'none', textAlign:'center', fontFamily:L.font, boxSizing:'border-box',
          }}
        />
        {err && <div style={{ color:'#dc3545', fontSize:12, marginTop:6, textAlign:'center' }}>Nepareizs PIN</div>}
        <div style={{ display:'flex', gap:8, marginTop:16 }}>
          <button onClick={onClose} style={{
            flex:1, padding:'10px', background:L.surface, border:`1px solid ${L.border}`,
            borderRadius:8, cursor:'pointer', fontSize:13, fontFamily:L.font, color:L.textMut,
          }}>Atcelt</button>
          <button onClick={check} style={{
            flex:1, padding:'10px', background:'#dc3545', border:'none',
            borderRadius:8, cursor:'pointer', fontSize:13, fontFamily:L.font, color:'#fff', fontWeight:700,
          }}>Apstiprināt</button>
        </div>
      </div>
    </>
  )
}

// ── Design tokens (light) ─────────────────────────────────────────
const L = {
  bg:          '#ffffff',
  surface:     '#f8f9fa',
  surfaceHov:  '#f1f3f5',
  border:      '#dee2e6',
  borderLight: '#e9ecef',
  text:        '#212529',
  textMut:     '#6c757d',
  textFaint:   '#adb5bd',
  accent:      '#2e7d32',
  accentHov:   '#1b5e20',
  accentLight: '#e8f5e9',
  accentBorder:'#a5d6a7',
  red:         '#dc3545',
  font:        "'Inter', 'Segoe UI', Arial, sans-serif",
}

const KATEGORIJAS = [
  { id: 'all',          label: 'Visi produkti', icon: '🌲' },
  { id: 'bears',        label: 'Lāču drošība',  icon: '🐻' },
  { id: 'ticks',        label: 'Ērces & odi',   icon: '🦟' },
  { id: 'measurement',  label: 'Mērinstrumenti',icon: '📏' },
  { id: 'boots',        label: 'Apavi',         icon: '👟' },
  { id: 'surveillance', label: 'Novērošana',    icon: '📷' },
  { id: 'safety',       label: 'Drošība',       icon: '🔦' },
]

const KAT_ICON = { bears:'🐻', ticks:'🦟', measurement:'📏', boots:'👟', surveillance:'📷', safety:'🔦' }

function imgPlaceholder(category) {
  const icon = KAT_ICON[category] || '📦'
  return (
    <div style={{
      width: '100%', paddingBottom: '100%', position: 'relative',
      background: L.accentLight, borderRadius: 10,
    }}>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: 48,
      }}>{icon}</div>
    </div>
  )
}

// ── PRODUCT CARD ──────────────────────────────────────────────────
function ProduktaKarte({ p, onView, onPievieno, isAdmin, onIzņemt }) {
  const [hover, setHover] = useState(false)
  const [pievienots, setPievienots] = useState(false)

  function handlePievieno(e) {
    e.stopPropagation()
    onPievieno(p)
    setPievienots(true)
    setTimeout(() => setPievienots(false), 1500)
  }

  return (
    <div
      onClick={() => onView(p.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: L.bg, border: `1px solid ${hover ? L.accentBorder : L.border}`,
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        transition: 'all 0.18s', boxShadow: hover ? '0 4px 20px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hover ? 'translateY(-2px)' : 'none',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Bilde */}
      <div style={{ position: 'relative', background: L.accentLight }}>
        {p.image_url
          ? <img src={p.image_url} alt={p.name_lv} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }}
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
          : null}
        <div style={{ display: p.image_url ? 'none' : 'flex', width: '100%', aspectRatio: '1/1',
          alignItems: 'center', justifyContent: 'center', fontSize: 52 }}>
          {KAT_ICON[p.category] || '📦'}
        </div>
        {/* Kategorijas badge */}
        <div style={{
          position: 'absolute', top: 8, left: 8,
          background: 'rgba(255,255,255,0.92)', borderRadius: 6,
          padding: '2px 8px', fontSize: 11, color: L.accent, fontWeight: 600,
          backdropFilter: 'blur(4px)',
        }}>
          {KAT_ICON[p.category] || ''} {KATEGORIJAS.find(k => k.id === p.category)?.label || p.category}
        </div>
      </div>

      {/* Teksts */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: L.text, lineHeight: 1.3 }}>{p.name_lv}</div>
        <div style={{ fontSize: 12, color: L.textMut, lineHeight: 1.5, flex: 1 }}>{p.tagline}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: L.accent }}>{p.price_sell?.toFixed(2)} €</span>
          <button
            onClick={handlePievieno}
            style={{
              background: pievienots ? L.accent : L.accentLight,
              color: pievienots ? '#fff' : L.accent,
              border: `1px solid ${L.accentBorder}`,
              borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: L.font,
            }}
          >
            {pievienots ? '✓ Pievienots' : 'Apskatīt'}
          </button>
        </div>
        {isAdmin && (
          <button
            onClick={e => { e.stopPropagation(); onIzņemt(p.id) }}
            style={{
              width:'100%', marginTop:8, padding:'6px', background:'#fff0f0',
              border:'1px solid #f5c2c7', borderRadius:6, color:'#dc3545',
              fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:L.font,
            }}
          >🗑 Izņemt no veikala</button>
        )}
      </div>
    </div>
  )
}

// ── PRODUCT DETAIL ────────────────────────────────────────────────
function ProduktaLapa({ p, onAtpakal, onPievieno, isAdmin, onIzņemt }) {
  const [imgErr, setImgErr] = useState(false)
  const [pievienots, setPievienots] = useState(false)

  function handlePievieno() {
    onPievieno(p)
    setPievienots(true)
    setTimeout(() => setPievienots(false), 2000)
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 60px' }}>
      {/* Breadcrumb */}
      <button onClick={onAtpakal} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: L.textMut, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5,
        padding: '0 0 20px', fontFamily: L.font, transition: 'color 0.15s',
      }} onMouseOver={e => e.currentTarget.style.color = L.accent}
         onMouseOut={e => e.currentTarget.style.color = L.textMut}>
        ← Atpakaļ uz veikalu
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 40, alignItems: 'start' }}>
        {/* Kreisā — bilde */}
        <div>
          {p.image_url && !imgErr
            ? <img src={p.image_url} alt={p.name_lv} onError={() => setImgErr(true)}
                style={{ width: '100%', borderRadius: 14, objectFit: 'cover', aspectRatio: '1/1', display: 'block',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: `1px solid ${L.border}` }} />
            : <div style={{ width: '100%', aspectRatio: '1/1', background: L.accentLight, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
                {KAT_ICON[p.category] || '📦'}
              </div>
          }
        </div>

        {/* Labā — info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Kategorija */}
          <span style={{ fontSize: 12, fontWeight: 600, color: L.accent, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {KAT_ICON[p.category]} {KATEGORIJAS.find(k => k.id === p.category)?.label || p.category}
          </span>

          {/* Nosaukums */}
          <h1 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: L.text, lineHeight: 1.2 }}>
            {p.name_lv}
          </h1>

          {/* Tagline */}
          {p.tagline && (
            <p style={{ margin: 0, fontSize: 15, color: L.textMut, lineHeight: 1.6, fontStyle: 'italic' }}>
              {p.tagline}
            </p>
          )}

          {/* Cena */}
          <div style={{ background: L.accentLight, border: `1px solid ${L.accentBorder}`, borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: L.accent, lineHeight: 1 }}>
              {p.price_sell?.toFixed(2)} €
            </div>
            <div style={{ fontSize: 12, color: L.textMut, marginTop: 4 }}>
              {p.delivery_info || 'Piegāde 7–21 dienas'}
            </div>
          </div>

          {/* Poga */}
          <button onClick={handlePievieno} style={{
            background: pievienots ? '#1b5e20' : L.accent,
            color: '#fff', border: 'none', borderRadius: 10,
            padding: '16px 24px', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.18s', fontFamily: L.font,
            boxShadow: pievienots ? 'none' : '0 4px 16px rgba(46,125,50,0.3)',
          }}>
            {pievienots ? '✓ Ielikt grozā!' : '🛒 Ielikt grozā'}
          </button>
        </div>
      </div>

      {/* Apraksts */}
      {p.description_lv && (
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: L.text, marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${L.borderLight}` }}>
            Produkta apraksts
          </h2>
          <div style={{ fontSize: 14, color: L.textMut, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {p.description_lv}
          </div>
        </div>
      )}

      {/* Iezīmes */}
      {Array.isArray(p.features) && p.features.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: L.text, marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${L.borderLight}` }}>
            Galvenās iezīmes
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {p.features.map((f, i) => (
              <div key={i} style={{
                background: L.surface, border: `1px solid ${L.border}`,
                borderRadius: 10, padding: '14px 16px',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: L.textMut, lineHeight: 1.5 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apakšā pogas */}
      <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={onAtpakal} style={{
          background: L.surface, border: `1px solid ${L.border}`,
          borderRadius: 8, padding: '12px 20px', fontSize: 13, cursor: 'pointer',
          color: L.textMut, fontFamily: L.font, fontWeight: 500,
        }}>← Atpakaļ uz veikalu</button>
        <button onClick={handlePievieno} style={{
          background: pievienots ? '#1b5e20' : L.accent,
          color: '#fff', border: 'none', borderRadius: 8,
          padding: '12px 24px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: L.font,
        }}>
          {pievienots ? '✓ Grozā!' : '🛒 Ielikt grozā'}
        </button>
        {isAdmin && (
          <button onClick={() => onIzņemt(p.id)} style={{
            background: '#fff0f0', border: '1px solid #f5c2c7', borderRadius: 8,
            padding: '12px 20px', fontSize: 13, cursor: 'pointer',
            color: '#dc3545', fontFamily: L.font, fontWeight: 600,
          }}>🗑 Izņemt no veikala</button>
        )}
      </div>
    </div>
  )
}

// ── PARCEL LOCKER HELPERS ─────────────────────────────────────────
const CACHE_TTL = 24 * 60 * 60 * 1000

async function cachedFetch(cacheKey, url) {
  try {
    const raw = localStorage.getItem(cacheKey)
    if (raw) {
      const { data, ts } = JSON.parse(raw)
      if (Date.now() - ts < CACHE_TTL) return data
    }
    const resp = await fetch(url)
    if (!resp.ok) return null
    const data = await resp.json()
    localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }))
    return data
  } catch { return null }
}

function normFilt(s) {
  return String(s || '').toLowerCase()
    .replace(/ā/g,'a').replace(/č/g,'c').replace(/ē/g,'e').replace(/ģ/g,'g')
    .replace(/ī/g,'i').replace(/ķ/g,'k').replace(/ļ/g,'l').replace(/ņ/g,'n')
    .replace(/š/g,'s').replace(/ū/g,'u').replace(/ž/g,'z')
}

function normalizOmniva(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(s => String(s.TYPE) === '0')
    .map(s => ({
      id: (s.NAME || '') + (s.ZIP || ''),
      city: (s.A0_NAME || s.A1_NAME || '').trim(),
      name: (s.NAME || '').trim(),
      address: [s.A3_NAME, s.ZIP].filter(Boolean).join(', '),
    }))
    .filter(s => s.city && s.name)
}

function normalizDPD(raw) {
  const list = raw?.parcelShops || raw?.data || (Array.isArray(raw) ? raw : [])
  if (!Array.isArray(list)) return []
  return list
    .map((s, i) => ({
      id: String(s.parcelShopId || s.id || i),
      city: (s.address?.city || s.city || '').trim(),
      name: (s.company || s.name || s.parcelShopId || '').trim(),
      address: [s.address?.street, s.address?.houseNo, s.address?.zipCode].filter(Boolean).join(' '),
    }))
    .filter(s => s.city)
}



const OPERATORI = [
  { id: 'omniva', label: 'Omniva', days: '2–4 d.', cacheKey: null, url: null, normaliz: null, static: OMNIVA_PAKOMATI },
  { id: 'dpd',    label: 'DPD',    days: '2–3 d.', cacheKey: null,              url: null, normaliz: null, static: DPD_PAKOMATI },
  { id: 'lp',     label: 'LP',     days: '3–5 d.', cacheKey: null,              url: null, normaliz: null, static: LP_PAKOMATI },
]

// ── ORDER FORM MODAL ──────────────────────────────────────────────
function PasutijumaForma({ groze, kopsumma, onClose, onAtpakal, onSuccess }) {
  const [form, setForm]       = useState({ vards: '', epasts: '', talrunis: '', adrese: '' })
  const [kludas, setKludas]   = useState({})
  const [suta, setSuta]       = useState(false)
  const [err, setErr]         = useState(null)

  // Delivery
  const [piegade, setPiegade]         = useState('pakomats')
  const [operatorsId, setOperatorsId] = useState('omniva')
  const [pakomati, setPakomati]       = useState([])
  const [ielades, setIelades]         = useState(false)
  const [apiKluda, setApiKluda]       = useState(null)
  // Two-step: city first → then locker
  const [cityInput, setCityInput]     = useState('')
  const [showCityDrop, setShowCityDrop] = useState(false)
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedPak, setSelectedPak] = useState(null)
  const [pakMekl, setPakMekl] = useState('')

  const piegadeCena  = piegade === 'pakomats' ? 3.50 : 5.50
  const kopaKopa     = kopsumma + piegadeCena
  const opMeta       = OPERATORI.find(o => o.id === operatorsId)

  // Load parcel shops when operator or delivery type changes
  useEffect(() => {
    if (piegade !== 'pakomats') return
    setSelectedPak(null)
    setSelectedCity(null)
    setCityInput('')
    setPakMekl('')
    setApiKluda(null)

    const op = OPERATORI.find(o => o.id === operatorsId)
    if (op.static) { setPakomati(op.static); return }

    setIelades(true)
    cachedFetch(op.cacheKey, op.url)
      .then(raw => {
        if (!raw) { setApiKluda('Neizdevās ielādēt Omniva sarakstu'); setPakomati([]); return }
        setPakomati(op.normaliz(raw))
      })
      .catch(() => setApiKluda('Tīkla kļūda — mēģini vēlreiz'))
      .finally(() => setIelades(false))
  }, [operatorsId, piegade]) // eslint-disable-line

  // Unikālās pilsētas no ielādētā saraksta
  const uniqueCities = [...new Set(pakomati.map(p => p.city).filter(Boolean))].sort()
  const filtCities = cityInput.trim().length < 1
    ? uniqueCities.slice(0, 8)
    : uniqueCities.filter(c => normFilt(c).includes(normFilt(cityInput))).slice(0, 10)
  const cityLockers = selectedCity ? pakomati.filter(p => p.city === selectedCity) : []
  const filtCityLockers = pakMekl.trim().length < 1
    ? cityLockers
    : cityLockers.filter(p =>
        normFilt(p.name).includes(normFilt(pakMekl)) ||
        normFilt(p.address).includes(normFilt(pakMekl))
      )

  function validet() {
    const k = {}
    if (!form.vards.trim())  k.vards  = 'Obligāts lauks'
    if (!form.epasts.trim()) k.epasts = 'Obligāts lauks'
    else if (!/\S+@\S+\.\S+/.test(form.epasts)) k.epasts = 'Nepareizs e-pasts'
    if (piegade === 'pakomats' && !selectedPak) k.pakomats = 'Izvēlieties pakomātu'
    if (piegade === 'kurjers' && !form.adrese.trim()) k.adrese = 'Obligāts lauks'
    setKludas(k)
    return Object.keys(k).length === 0
  }

  async function iesniegt() {
    if (!validet()) return
    setSuta(true); setErr(null)

    const opLabel = opMeta?.label || operatorsId
    const adrese = piegade === 'pakomats'
      ? `${opLabel}: ${selectedPak.name}, ${selectedPak.address}${selectedPak.city ? ', ' + selectedPak.city : ''}`
      : form.adrese.trim()
    const piegadeNotes = piegade === 'pakomats'
      ? `Piegāde: ${opLabel} pakomāts ${piegadeCena.toFixed(2)}€ (${opMeta?.days || ''})`
      : `Piegāde: Kurjers ${piegadeCena.toFixed(2)}€ (3–5 d.)`

    const pasutijumi = groze.map(({ product: p, qty }) => ({
      product_id:       p.id,
      product_name:     p.name_lv,
      customer_name:    form.vards.trim(),
      customer_email:   form.epasts.trim(),
      customer_phone:   form.talrunis.trim() || null,
      customer_address: adrese,
      quantity:         qty,
      price_total:      parseFloat((p.price_sell * qty).toFixed(2)),
      status:           'jauns',
      notes:            piegadeNotes,
      delivery_days:    piegade === 'pakomats' ? opMeta?.days || '2–4 d.' : '3–5 d.',
    }))

    const { error } = await supabase.from('orders').insert(pasutijumi)
    setSuta(false)
    if (error) { setErr('Pasūtījuma kļūda: ' + error.message); return }

    console.log('📧 Pasūtījuma apstiprinājums:', {
      klients: form.epasts, adrese, piegade: piegadeNotes,
      preces: groze.map(({ product: p, qty }) => `${p.name_lv} × ${qty} = ${(p.price_sell * qty).toFixed(2)} €`),
      kopsumma: `${kopaKopa.toFixed(2)} €`,
    })
    onSuccess()
  }

  const inp = (field, label, type = 'text', required = true) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: L.text, marginBottom: 4 }}>
        {label}{required && <span style={{ color: L.red }}> *</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={e => { setForm(f => ({ ...f, [field]: e.target.value })); setKludas(k => ({ ...k, [field]: undefined })) }}
        style={{
          width: '100%', padding: '9px 12px', fontSize: 14,
          border: `1.5px solid ${kludas[field] ? L.red : L.border}`,
          borderRadius: 8, outline: 'none', fontFamily: L.font, boxSizing: 'border-box',
          color: '#212529', background: '#ffffff',
        }}
      />
      {kludas[field] && <div style={{ color: L.red, fontSize: 11, marginTop: 3 }}>{kludas[field]}</div>}
    </div>
  )

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2200 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#fff', borderRadius: 16, padding: '24px 24px 20px',
        zIndex: 2201, width: 460, maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 12px 50px rgba(0,0,0,0.2)', fontFamily: L.font,
      }}>
        {/* Virsraksts */}
        <div style={{ fontSize: 17, fontWeight: 800, color: L.text, marginBottom: 2 }}>📦 Noformēt pasūtījumu</div>
        <div style={{ fontSize: 12, color: L.textMut, marginBottom: 18 }}>
          Preces: <strong style={{ color: L.text }}>{kopsumma.toFixed(2)} €</strong>
          {' + '}piegāde: <strong style={{ color: L.accent }}>{piegadeCena.toFixed(2)} €</strong>
          {' = '}<strong style={{ color: L.accent, fontSize: 14 }}>{kopaKopa.toFixed(2)} €</strong>
        </div>

        {/* Kontaktinformācija */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: L.textMut, fontWeight: 700, marginBottom: 10 }}>
          Kontaktinformācija
        </div>
        {inp('vards',   '👤 Vārds, Uzvārds')}
        {inp('epasts',  '📧 E-pasta adrese', 'email')}
        {inp('talrunis','📞 Tālrunis', 'tel', false)}

        {/* Piegādes veids */}
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: L.textMut, fontWeight: 700, margin: '14px 0 10px' }}>
          Piegādes veids
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { id: 'pakomats', icon: '📦', label: 'Pakomāts', price: '3.50 €' },
            { id: 'kurjers',  icon: '🚗', label: 'Kurjers',  price: '5.50 €' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => { setPiegade(v.id); setKludas(k => ({ ...k, pakomats: undefined, adrese: undefined })) }}
              style={{
                padding: '12px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: L.font,
                border: `2px solid ${piegade === v.id ? L.accent : L.border}`,
                background: piegade === v.id ? L.accentLight : L.surface,
                textAlign: 'center', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 2 }}>{v.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: piegade === v.id ? L.accent : L.text }}>{v.label}</div>
              <div style={{ fontSize: 12, color: L.textMut }}>{v.price}</div>
            </button>
          ))}
        </div>

        {/* Pakomāts sadaļa */}
        {piegade === 'pakomats' && (
          <div>
            {/* Operators */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {OPERATORI.map(op => (
                <button
                  key={op.id}
                  onClick={() => setOperatorsId(op.id)}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: L.font, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${operatorsId === op.id ? L.accent : L.border}`,
                    background: operatorsId === op.id ? L.accentLight : L.surface,
                    color: operatorsId === op.id ? L.accent : L.textMut,
                    transition: 'all 0.15s',
                  }}
                >
                  {op.label}<br/>
                  <span style={{ fontSize: 10, fontWeight: 400 }}>{op.days}</span>
                </button>
              ))}
            </div>

            {/* 1. solis: Pilsēta */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: L.text, marginBottom: 4 }}>
                🌆 Pilsēta <span style={{ color: L.red }}>*</span>
              </label>
              {selectedCity ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: L.accentLight, border: `1.5px solid ${L.accentBorder}`,
                  borderRadius: 8, padding: '8px 12px',
                }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: L.accent }}>{selectedCity}</span>
                  <button
                    onClick={() => { setSelectedCity(null); setSelectedPak(null); setCityInput(''); setPakMekl('') }}
                    style={{ background: 'none', border: 'none', color: L.textMut, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px' }}
                  >×</button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    value={cityInput}
                    onChange={e => { setCityInput(e.target.value); setShowCityDrop(true) }}
                    onFocus={() => setShowCityDrop(true)}
                    onBlur={() => setTimeout(() => setShowCityDrop(false), 150)}
                    placeholder={ielades ? 'Ielādē sarakstu...' : 'Ievadi pilsētu (piem. Rīga, Valmiera...)'}
                    disabled={ielades}
                    style={{
                      width: '100%', padding: '9px 12px', fontSize: 13,
                      border: `1.5px solid ${kludas.pakomats && !selectedCity ? L.red : L.border}`,
                      borderRadius: 8, outline: 'none', fontFamily: L.font,
                      boxSizing: 'border-box', color: '#212529', background: '#ffffff',
                    }}
                  />
                  {apiKluda && (
                    <div style={{ fontSize: 11, color: '#e65100', marginTop: 4 }}>⚠️ {apiKluda}</div>
                  )}
                  {showCityDrop && filtCities.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                      background: '#fff', border: `1px solid ${L.border}`,
                      borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      maxHeight: 200, overflowY: 'auto', marginTop: 2,
                    }}>
                      {filtCities.map(city => (
                        <div
                          key={city}
                          onMouseDown={() => { setSelectedCity(city); setCityInput(''); setShowCityDrop(false); setKludas(k => ({ ...k, pakomats: undefined })) }}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${L.borderLight}`, fontSize: 14, color: L.text }}
                          onMouseEnter={e => e.currentTarget.style.background = L.surface}
                          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                        >
                          🌆 {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. solis: Pakomāts pilsētā */}
            {selectedCity && (
              <div style={{ marginBottom: 4 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: L.text, marginBottom: 4 }}>
                  📦 Pakomāts <span style={{ color: L.red }}>*</span>
                  <span style={{ fontWeight: 400, color: L.textMut, marginLeft: 6 }}>({filtCityLockers.length}{pakMekl ? `/${cityLockers.length}` : ''} {operatorsId === 'omniva' ? 'terminā' : 'punkti'})</span>
                </label>
                {selectedPak ? (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    background: L.accentLight, border: `1.5px solid ${L.accentBorder}`,
                    borderRadius: 8, padding: '10px 12px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: L.accent }}>{selectedPak.name}</div>
                      <div style={{ fontSize: 11, color: L.textMut, marginTop: 1 }}>{selectedPak.address}</div>
                    </div>
                    <button
                      onClick={() => setSelectedPak(null)}
                      style={{ background: 'none', border: 'none', color: L.textMut, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}
                    >×</button>
                  </div>
                ) : (
                  <>
                  {cityLockers.length > 4 && (
                    <input
                      value={pakMekl}
                      onChange={e => setPakMekl(e.target.value)}
                      placeholder="Ielas nosaukums vai pakomāta nosaukums..."
                      style={{
                        width: '100%', padding: '8px 12px', fontSize: 12,
                        border: `1.5px solid ${L.border}`, borderRadius: 8,
                        outline: 'none', fontFamily: L.font, boxSizing: 'border-box',
                        color: '#212529', background: '#ffffff', marginBottom: 6,
                      }}
                    />
                  )}
                  <div style={{
                    maxHeight: 190, overflowY: 'auto',
                    border: `1.5px solid ${kludas.pakomats ? L.red : L.border}`,
                    borderRadius: 8, background: '#ffffff',
                  }}>
                    {filtCityLockers.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedPak(p); setKludas(k => ({ ...k, pakomats: undefined })) }}
                        style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${L.borderLight}` }}
                        onMouseEnter={e => e.currentTarget.style.background = L.surface}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: L.text }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: L.textMut, marginTop: 1 }}>{p.address}</div>
                      </div>
                    ))}
                  </div>
                  </>
                )}
                {kludas.pakomats && !selectedPak && (
                  <div style={{ color: L.red, fontSize: 11, marginTop: 3 }}>Izvēlieties pakomātu</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Kurjera adrese */}
        {piegade === 'kurjers' && (
          <div style={{ marginBottom: 4 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: L.text, marginBottom: 4 }}>
              📍 Piegādes adrese <span style={{ color: L.red }}>*</span>
            </label>
            <textarea
              value={form.adrese}
              onChange={e => { setForm(f => ({ ...f, adrese: e.target.value })); setKludas(k => ({ ...k, adrese: undefined })) }}
              placeholder="Iela, māja, dzīvoklis, pilsēta, pasta indekss"
              rows={3}
              style={{
                width: '100%', padding: '9px 12px', fontSize: 13, resize: 'vertical',
                border: `1.5px solid ${kludas.adrese ? L.red : L.border}`,
                borderRadius: 8, outline: 'none', fontFamily: L.font,
                boxSizing: 'border-box', color: '#212529', background: '#ffffff',
              }}
            />
            {kludas.adrese && <div style={{ color: L.red, fontSize: 11, marginTop: 3 }}>{kludas.adrese}</div>}
          </div>
        )}

        {/* Kļūda */}
        {err && (
          <div style={{ padding: '10px 12px', background: '#fff0f0', border: '1px solid #f5c2c7', borderRadius: 8, color: L.red, fontSize: 12, margin: '12px 0 4px' }}>
            {err}
          </div>
        )}

        {/* Kopsavilkums + pogas */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${L.borderLight}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
            <span style={{ color: L.textMut }}>Kopā ar piegādi</span>
            <strong style={{ color: L.accent, fontSize: 18 }}>{kopaKopa.toFixed(2)} €</strong>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onAtpakal || onClose} disabled={suta} style={{
              flex: 1, padding: '12px', background: L.surface, border: `1px solid ${L.border}`,
              borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: L.font, color: L.textMut,
            }}>← Labot grozu</button>
            <button onClick={iesniegt} disabled={suta} style={{
              flex: 2, padding: '12px', border: 'none', borderRadius: 10,
              background: suta ? L.surface : L.accent,
              color: suta ? L.textMut : '#fff',
              fontSize: 14, fontWeight: 700, cursor: suta ? 'not-allowed' : 'pointer', fontFamily: L.font,
            }}>
              {suta ? 'Sūta...' : '✅ Apstiprināt pasūtījumu'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── CART DRAWER ───────────────────────────────────────────────────
function GrozaDrawer({ open, onClose, groze, nonem, mainit, kopsumma, onPasutit }) {
  const drawerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        zIndex: 1100, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none',
        transition: 'opacity 0.22s',
      }} />

      {/* Drawer */}
      <div ref={drawerRef} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, maxWidth: '90vw',
        background: L.bg, zIndex: 1101, boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column', fontFamily: L.font,
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: `1px solid ${L.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: L.text }}>🛒 Grozs</div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: L.textMut, lineHeight: 1,
          }}>×</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {groze.length === 0
            ? <div style={{ padding: '40px 20px', textAlign: 'center', color: L.textFaint }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
                <div style={{ fontSize: 14 }}>Grozs ir tukšs</div>
              </div>
            : groze.map(({ product: p, qty }) => (
              <div key={p.id} style={{
                padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'flex-start',
                borderBottom: `1px solid ${L.borderLight}`,
              }}>
                {/* Thumb */}
                <div style={{
                  width: 60, height: 60, borderRadius: 8, flexShrink: 0,
                  background: L.accentLight, overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                }}>
                  {p.image_url
                    ? <img src={p.image_url} alt="" onError={e => e.target.style.display='none'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : KAT_ICON[p.category] || '📦'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: L.text, marginBottom: 4, lineHeight: 1.3 }}>{p.name_lv}</div>
                  <div style={{ fontSize: 12, color: L.textMut, marginBottom: 8 }}>{(p.price_sell || 0).toFixed(2)} € / gab</div>
                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => mainit(p.id, qty - 1)} style={qtyBtn}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 600, color: L.text, minWidth: 20, textAlign: 'center' }}>{qty}</span>
                    <button onClick={() => mainit(p.id, qty + 1)} style={qtyBtn}>+</button>
                    <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: L.accent }}>
                      {(p.price_sell * qty).toFixed(2)} €
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button onClick={() => nonem(p.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: L.textFaint,
                  fontSize: 16, padding: '2px 4px', flexShrink: 0, lineHeight: 1,
                }} title="Dzēst">×</button>
              </div>
            ))
          }
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${L.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: L.textMut }}>Kopā</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: L.accent }}>{kopsumma.toFixed(2)} €</span>
          </div>
          <button
            onClick={onPasutit}
            disabled={groze.length === 0}
            style={{
              width: '100%', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 700,
              border: 'none', fontFamily: L.font, transition: 'all 0.15s',
              background: groze.length === 0 ? L.surface : L.accent,
              color: groze.length === 0 ? L.textFaint : '#fff',
              cursor: groze.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: groze.length > 0 ? '0 4px 14px rgba(46,125,50,0.25)' : 'none',
            }}
          >
            {groze.length === 0 ? 'Grozs ir tukšs' : 'PASŪTĪT'}
          </button>
        </div>
      </div>
    </>
  )
}

const qtyBtn = {
  width: 26, height: 26, background: '#f1f3f5', border: '1px solid #dee2e6',
  borderRadius: 6, cursor: 'pointer', fontSize: 14, display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: '#495057', fontWeight: 700,
  fontFamily: "'Inter',sans-serif", padding: 0,
}

// ── SHOP HEADER ───────────────────────────────────────────────────
function VeikalsHeader({ onBack, skaits, onGroza }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${L.border}`, height: 56,
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      fontFamily: L.font,
    }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: L.textMut, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 0', transition: 'color 0.15s', fontFamily: L.font,
      }} onMouseOver={e => e.currentTarget.style.color = L.accent}
         onMouseOut={e => e.currentTarget.style.color = L.textMut}>
        ← Meža Tirgus
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>🌲</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: L.text }}>Veikals</span>
      </div>

      {/* Cart button */}
      <button onClick={onGroza} style={{
        position: 'relative', background: skaits > 0 ? L.accentLight : L.surface,
        border: `1px solid ${skaits > 0 ? L.accentBorder : L.border}`,
        borderRadius: 8, width: 44, height: 44, display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer', fontSize: 18, transition: 'all 0.15s',
      }} title="Grozs">
        🛒
        {skaits > 0 && (
          <div style={{
            position: 'absolute', top: -5, right: -5,
            background: L.red, color: '#fff', borderRadius: '50%',
            width: 18, height: 18, fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>{skaits > 9 ? '9+' : skaits}</div>
        )}
      </button>
    </div>
  )
}

// ── HIDDEN PRODUCTS (localStorage blocklist) ──────────────────────
const HIDDEN_KEY = 'mt_hidden_products'
const getHidden  = () => { try { return JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]') } catch { return [] } }
const addHidden  = (id) => { const ids = getHidden(); if (!ids.includes(id)) localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids, id])) }

// ── MAIN COMPONENT ────────────────────────────────────────────────
export default function VeikalsPage({ onBack, user }) {
  const [view,        setView]       = useState('grid')
  const [selectedId,  setSelectedId] = useState(null)
  const [produkti,    setProdukti]   = useState([])
  const [loading,     setLoading]    = useState(true)
  const [kategorija,  setKategorija] = useState('all')
  const [grozaOpen,   setGrozaOpen]  = useState(false)
  const [pinTarget,   setPinTarget]  = useState(null)
  const [showPasutForma, setShowPasutForma] = useState(false)
  const [pasutVeiksmigi, setPasutVeiksmigi] = useState(false)
  const { groze, pievieno, nonem, mainit, notirit, skaits, kopsumma } = useGroza()

  const isAdmin = user?.epasts === ADMIN_EMAIL

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name_lv, tagline, price_sell, category, active, created_at, image_url')
      .neq('active', false)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Veikals Supabase kļūda:', error)
        const hidden = getHidden()
        setProdukti((data || []).filter(p => !hidden.includes(String(p.id))))
        setLoading(false)
      })
  }, [])

  const filtrets = kategorija === 'all'
    ? produkti
    : produkti.filter(p => p.category === kategorija)

  const [fullProduct, setFullProduct] = useState(null)
  const selectedProduct = fullProduct || produkti.find(p => p.id === selectedId)

  function openProduct(id) {
    setSelectedId(id)
    setFullProduct(null)
    setView('product')
    window.scrollTo(0, 0)
    // Ielādē pilno ierakstu (ar image_url, features, description utt.)
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data }) => { if (data) setFullProduct(data) })
  }

  function backToGrid() {
    setView('grid')
    setSelectedId(null)
    setFullProduct(null)
  }

  function handlePievieno(p) {
    pievieno(p)
    setGrozaOpen(true)
  }

  function handlePasutit() {
    if (groze.length === 0) return
    setGrozaOpen(false)
    setShowPasutForma(true)
  }

  function handlePasutFormaAtpakal() {
    setShowPasutForma(false)
    setGrozaOpen(true)
  }

  function handlePasutVeiksmigi() {
    setShowPasutForma(false)
    setPasutVeiksmigi(true)
    notirit()
    setTimeout(() => setPasutVeiksmigi(false), 5000)
  }

  function handleIzņemt(id) {
    setPinTarget(id)
  }

  async function izņemtApstiprinats() {
    if (!pinTarget) return
    // Saglabā lokāli — garantēti strādā neatkarīgi no Supabase RLS
    addHidden(String(pinTarget))
    // Mēģina dzēst Supabase (best effort)
    supabase.from('products').delete().eq('id', pinTarget).then(({ error }) => {
      if (error) console.warn('Supabase delete:', error.message)
    })
    setProdukti(prev => prev.filter(p => String(p.id) !== String(pinTarget)))
    if (selectedId === pinTarget) backToGrid()
    setPinTarget(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: L.bg, color: L.text, fontFamily: L.font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .vk-filter:hover { background: ${L.accentLight} !important; border-color: ${L.accentBorder} !important; color: ${L.accent} !important; }
        .vk-filter-active { background: ${L.accent} !important; color: #fff !important; border-color: ${L.accent} !important; }
        @media (max-width: 640px) {
          .vk-grid { grid-template-columns: 1fr !important; }
          .vk-detail-cols { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .vk-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Header */}
      <VeikalsHeader onBack={onBack} skaits={skaits} onGroza={() => setGrozaOpen(v => !v)} />

      {/* Cart drawer */}
      <GrozaDrawer open={grozaOpen} onClose={() => setGrozaOpen(false)}
        groze={groze} nonem={nonem} mainit={mainit} kopsumma={kopsumma} onPasutit={handlePasutit} />

      {/* PIN modālis */}
      {pinTarget && (
        <PinModal onConfirm={izņemtApstiprinats} onClose={() => setPinTarget(null)} />
      )}

      {/* Pasūtījuma forma */}
      {showPasutForma && (
        <PasutijumaForma
          groze={groze}
          kopsumma={kopsumma}
          onClose={() => setShowPasutForma(false)}
          onAtpakal={handlePasutFormaAtpakal}
          onSuccess={handlePasutVeiksmigi}
        />
      )}

      {/* Veiksmīga pasūtījuma paziņojums */}
      {pasutVeiksmigi && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2300 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: '#fff', borderRadius: 16, padding: '36px 32px',
            zIndex: 2301, textAlign: 'center', width: 360, maxWidth: '90vw',
            boxShadow: '0 12px 50px rgba(0,0,0,0.18)', fontFamily: L.font,
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: L.text, marginBottom: 8 }}>
              Pasūtījums saņemts!
            </div>
            <div style={{ fontSize: 14, color: L.textMut, lineHeight: 1.6 }}>
              Mēs sazināsimies ar Jums tuvākajā laikā<br/>lai apstiprinātu pasūtījumu un piegādi.
            </div>
            <button onClick={() => setPasutVeiksmigi(false)} style={{
              marginTop: 20, padding: '10px 28px', background: L.accent, color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: L.font,
            }}>Aizvērt</button>
          </div>
        </>
      )}

      {/* Grid view */}
      {view === 'grid' && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, color: L.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              Meža Tirgus Veikals
            </h1>
            <p style={{ fontSize: 15, color: L.textMut, margin: 0 }}>
              Aprīkojums meža darbiniekiem, medniekiem un meža īpašniekiem
            </p>
          </div>

          {/* Filtri */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32, justifyContent: 'center' }}>
            {KATEGORIJAS.map(k => (
              <button
                key={k.id}
                onClick={() => setKategorija(k.id)}
                className={`vk-filter${kategorija === k.id ? ' vk-filter-active' : ''}`}
                style={{
                  background: L.surface, border: `1px solid ${L.border}`,
                  borderRadius: 30, padding: '8px 16px', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', color: L.textMut, fontFamily: L.font, transition: 'all 0.15s',
                }}
              >
                {k.icon} {k.label}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: L.textMut }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${L.border}`, borderTopColor: L.accent,
                borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14 }}>Ielādē produktus...</div>
              <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
            </div>
          )}

          {/* Tukšs stāvoklis */}
          {!loading && filtrets.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: L.textMut }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{kategorija === 'all' ? '🌲' : KAT_ICON[kategorija]}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: L.text, marginBottom: 6 }}>
                {kategorija === 'all' ? 'Veikals drīzumā atverams' : 'Šajā kategorijā produktu nav'}
              </div>
              <div style={{ fontSize: 13 }}>
                {kategorija !== 'all' && <button onClick={() => setKategorija('all')}
                  style={{ background: 'none', border: 'none', color: L.accent, cursor: 'pointer', fontSize: 13, fontFamily: L.font }}>
                  ← Skatīt visus produktus
                </button>}
              </div>
            </div>
          )}

          {/* Grid */}
          {!loading && filtrets.length > 0 && (
            <>
              <div style={{ fontSize: 13, color: L.textMut, marginBottom: 16 }}>
                {filtrets.length} produkti
              </div>
              <div className="vk-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                {filtrets.map(p => (
                  <ProduktaKarte key={p.id} p={p} onView={openProduct} onPievieno={handlePievieno} isAdmin={isAdmin} onIzņemt={handleIzņemt} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Product detail view */}
      {view === 'product' && selectedProduct && (
        <div className="vk-detail-cols">
          <ProduktaLapa p={selectedProduct} onAtpakal={backToGrid} onPievieno={handlePievieno} isAdmin={isAdmin} onIzņemt={handleIzņemt} />
        </div>
      )}

      {/* Edge case: product not found */}
      {view === 'product' && !selectedProduct && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 14, color: L.textMut, marginBottom: 16 }}>Produkts nav atrasts</div>
          <button onClick={backToGrid} style={{
            background: L.accent, color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 20px', fontSize: 14, cursor: 'pointer', fontFamily: L.font,
          }}>← Atpakaļ uz veikalu</button>
        </div>
      )}
    </div>
  )
}
