import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import { C, F, R } from './ds'

const STATUSI = [
  { id: 'visi',      label: 'Visi' },
  { id: 'jauns',     label: '🆕 Jauns',     color: '#1565c0', bg: '#e3f2fd' },
  { id: 'apstrādē',  label: '⚙️ Apstrādē',  color: '#bf360c', bg: '#fff3e0' },
  { id: 'nosūtīts',  label: '🚚 Nosūtīts',  color: '#6a1b9a', bg: '#f3e5f5' },
  { id: 'piegādāts', label: '✅ Piegādāts', color: '#1b5e20', bg: '#e8f5e9' },
]

const STATUS_META = {
  jauns:     { color: '#1565c0', bg: '#e3f2fd', label: '🆕 Jauns' },
  apstrādē:  { color: '#bf360c', bg: '#fff3e0', label: '⚙️ Apstrādē' },
  nosūtīts:  { color: '#6a1b9a', bg: '#f3e5f5', label: '🚚 Nosūtīts' },
  piegādāts: { color: '#1b5e20', bg: '#e8f5e9', label: '✅ Piegādāts' },
}

const NEXT_STATUS = {
  jauns:    'apstrādē',
  apstrādē: 'nosūtīts',
  nosūtīts: 'piegādāts',
}

const NEXT_LABEL = {
  jauns:    '▶️ Sākt apstrādi',
  apstrādē: '📦 Atzīmēt kā nosūtītu',
  nosūtīts: '✅ Atzīmēt kā piegādātu',
}

function piegadeTermins(url) {
  if (!url) return null
  const u = url.toLowerCase()
  if (u.includes('aliexpress')) return '14–21 diena'
  if (u.includes('amazon.de'))  return '5–7 dienas'
  if (u.includes('amazon.com')) return '10–14 dienas'
  if (u.includes('amazon'))     return '7–14 dienas'
  return '7–21 diena'
}

function PasutijumaKarte({ pas, onStatusChange, onTrackingUpdate }) {
  const [open, setOpen]       = useState(false)
  const [tracking, setTracking] = useState(pas.tracking_code || '')
  const [glab, setGlab]       = useState(false)
  const [mainot, setMainot]   = useState(false)
  const sm   = STATUS_META[pas.status] || STATUS_META.jauns
  const next = NEXT_STATUS[pas.status]

  async function glabatTracking() {
    setGlab(true)
    const { error } = await supabase.from('orders').update({ tracking_code: tracking }).eq('id', pas.id)
    setGlab(false)
    if (!error) onTrackingUpdate(pas.id, tracking)
    else console.error('Tracking saglabāšanas kļūda:', error)
  }

  async function mainities() {
    if (!next) return
    setMainot(true)
    const upd = { status: next }
    if (tracking) upd.tracking_code = tracking
    const { error } = await supabase.from('orders').update(upd).eq('id', pas.id)
    setMainot(false)
    if (!error) onStatusChange(pas.id, next)
    else alert('Statusa atjaunošanas kļūda: ' + error.message)
  }

  return (
    <div style={{
      background: C.bgCard, border: `1px solid ${C.greenBdr}`,
      borderRadius: R.lg, overflow: 'hidden', marginBottom: 10,
    }}>
      {/* Summary row */}
      <div onClick={() => setOpen(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px', cursor: 'pointer',
        background: open ? C.bgInner : 'transparent',
        transition: 'background 0.15s',
      }}>
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          color: sm.color, background: sm.bg, whiteSpace: 'nowrap', flexShrink: 0,
        }}>{sm.label}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: C.text,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {pas.product_name}
            {pas.quantity > 1 && (
              <span style={{ fontWeight: 400, color: C.textMut }}> × {pas.quantity}</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 1 }}>
            {pas.customer_name}
            {pas.customer_email && ` · ${pas.customer_email}`}
          </div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#4caf50' }}>
            {(pas.price_total || 0).toFixed(2)} €
          </div>
          <div style={{ fontSize: 11, color: C.textDim }}>
            {new Date(pas.created_at).toLocaleDateString('lv-LV')}
          </div>
        </div>

        <span style={{ color: C.textDim, fontSize: 11, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: '16px 18px', borderTop: `1px solid ${C.greenBdr}` }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
            {/* Klients */}
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textDim, fontWeight: 700, marginBottom: 8 }}>
                Klients
              </div>
              {[
                ['👤', pas.customer_name],
                ['📧', pas.customer_email],
                ['📞', pas.customer_phone],
                ['📍', pas.customer_address],
              ].filter(([, v]) => v).map(([icon, val]) => (
                <div key={icon} style={{ fontSize: 12, color: C.textSec, display: 'flex', gap: 6, marginBottom: 3 }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span style={{ wordBreak: 'break-all' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Pasūtījums */}
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textDim, fontWeight: 700, marginBottom: 8 }}>
                Pasūtījums
              </div>
              <div style={{ fontSize: 12, color: C.textSec, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div>📦 {pas.product_name}</div>
                <div>🔢 {pas.quantity || 1} gab.</div>
                <div>💶 <strong style={{ color: '#4caf50' }}>{(pas.price_total || 0).toFixed(2)} €</strong></div>
                {pas.delivery_days && <div>⏱ Piegāde: {pas.delivery_days}</div>}
                {pas.notes && <div style={{ marginTop: 4, fontStyle: 'italic' }}>📝 {pas.notes}</div>}
              </div>
            </div>
          </div>

          {/* Piegādātāja URL */}
          {pas.supplier_url && (
            <div style={{
              background: C.bgInner, borderRadius: R.md, padding: '10px 14px', marginBottom: 12,
            }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: C.textDim, fontWeight: 700, marginBottom: 6 }}>
                Piegādātājs
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, color: C.textMut, flex: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {pas.supplier_url}
                </span>
                {piegadeTermins(pas.supplier_url) && (
                  <span style={{ fontSize: 11, color: C.textDim, whiteSpace: 'nowrap' }}>
                    ⏱ {piegadeTermins(pas.supplier_url)}
                  </span>
                )}
                <button
                  onClick={() => window.open(pas.supplier_url, '_blank', 'noopener')}
                  style={{
                    padding: '6px 14px', borderRadius: 6, border: 'none',
                    background: '#1565c0', color: '#fff', fontSize: 12,
                    fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: F.family,
                  }}
                >
                  🛒 Pasūtīt pie piegādātāja →
                </button>
              </div>
            </div>
          )}

          {/* Tracking kods */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: C.textDim, fontWeight: 700, marginBottom: 6 }}>
              Izsekošanas kods
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={tracking}
                onChange={e => setTracking(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && glabatTracking()}
                placeholder="Piem. LV123456789LV..."
                style={{
                  flex: 1, background: '#0d1117', border: `1px solid ${C.greenBdr}`,
                  borderRadius: 6, padding: '8px 12px', color: C.text, fontSize: 12,
                  outline: 'none', fontFamily: F.family,
                }}
              />
              <button
                onClick={glabatTracking}
                disabled={glab || tracking === (pas.tracking_code || '')}
                style={{
                  padding: '8px 14px', borderRadius: 6, border: 'none',
                  background: (glab || tracking === (pas.tracking_code || '')) ? C.bgInner : '#388bfd',
                  color: (glab || tracking === (pas.tracking_code || '')) ? C.textDim : '#fff',
                  fontSize: 12, fontWeight: 600,
                  cursor: (glab || tracking === (pas.tracking_code || '')) ? 'not-allowed' : 'pointer',
                  fontFamily: F.family,
                }}
              >
                {glab ? '...' : '💾 Saglabāt'}
              </button>
            </div>
            {pas.tracking_code && (
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>
                Saglabāts: {pas.tracking_code}
              </div>
            )}
          </div>

          {/* Statusa maiņas poga */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {next ? (
              <button
                onClick={mainities}
                disabled={mainot}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: mainot ? C.bgInner : '#388bfd',
                  color: mainot ? C.textDim : '#fff',
                  fontSize: 13, fontWeight: 700,
                  cursor: mainot ? 'not-allowed' : 'pointer',
                  fontFamily: F.family,
                }}
              >
                {mainot ? 'Saglabā...' : NEXT_LABEL[pas.status]}
              </button>
            ) : (
              <span style={{ fontSize: 12, color: '#4caf50', fontWeight: 600 }}>
                ✅ Pasūtījums piegādāts
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BotsPardevejs() {
  const [pasutijumi,   setPasutijumi]  = useState([])
  const [loading,      setLoading]     = useState(true)
  const [filterStatus, setFilterStatus] = useState('visi')
  const [kludaMsg,     setKludaMsg]    = useState(null)

  const ielade = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) setKludaMsg(error.message)
    else { setPasutijumi(data || []); setKludaMsg(null) }
  }, [])

  useEffect(() => { ielade() }, [ielade])

  function onStatusChange(id, newStatus) {
    setPasutijumi(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
  }
  function onTrackingUpdate(id, code) {
    setPasutijumi(prev => prev.map(p => p.id === id ? { ...p, tracking_code: code } : p))
  }

  const menesis = new Date().getMonth()
  const stats = {
    jauni:    pasutijumi.filter(p => p.status === 'jauns').length,
    apstrade: pasutijumi.filter(p => p.status === 'apstrādē').length,
    nosutiti: pasutijumi.filter(p =>
      ['nosūtīts', 'piegādāts'].includes(p.status) &&
      new Date(p.created_at).getMonth() === menesis
    ).length,
    ienemumi: pasutijumi
      .filter(p => p.status === 'piegādāts')
      .reduce((s, p) => s + (p.price_total || 0), 0),
  }

  const filtreti = filterStatus === 'visi'
    ? pasutijumi
    : pasutijumi.filter(p => p.status === filterStatus)

  const cs = {
    background: C.bgCard, border: `1px solid ${C.greenBdr}`,
    borderRadius: R.lg, padding: '16px', textAlign: 'center',
  }

  return (
    <div style={{ fontFamily: F.family, color: C.text }}>

      {/* Statistika */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 10, marginBottom: 24 }}>
        {[
          { e: '🆕', v: stats.jauni,                         l: 'Jauni pasūtījumi' },
          { e: '⚙️', v: stats.apstrade,                      l: 'Apstrādē' },
          { e: '🚚', v: stats.nosutiti,                      l: 'Nosūtīts šomēnes' },
          { e: '💶', v: `${stats.ienemumi.toFixed(2)} €`,    l: 'Kopieņēmumi' },
        ].map(s => (
          <div key={s.l} style={cs}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.e}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#4caf50' }}>{s.v}</div>
            <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Status filtri */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUSI.map(s => (
          <button key={s.id} onClick={() => setFilterStatus(s.id)} style={{
            padding: '5px 12px', borderRadius: 20, border: 'none',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: F.family,
            background: filterStatus === s.id ? '#388bfd' : C.bgInner,
            color: filterStatus === s.id ? '#fff' : C.textMut,
            transition: 'all 0.15s',
          }}>
            {s.label}{' '}
            ({s.id === 'visi'
              ? pasutijumi.length
              : pasutijumi.filter(p => p.status === s.id).length})
          </button>
        ))}
        <button onClick={ielade} style={{
          marginLeft: 'auto', padding: '5px 12px', borderRadius: 20,
          border: `1px solid ${C.greenBdr}`, background: 'none',
          color: C.textMut, fontSize: 12, cursor: 'pointer', fontFamily: F.family,
        }}>
          🔄 Atjaunot
        </button>
      </div>

      {/* Saturs */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.textDim }}>
          Ielādē pasūtījumus...
        </div>
      ) : kludaMsg ? (
        <div style={{
          padding: '14px 16px', background: '#2d1515',
          border: '1px solid #7f2020', borderRadius: R.md,
          color: '#f87171', fontSize: 13,
        }}>
          ⚠️ {kludaMsg}
        </div>
      ) : filtreti.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.textDim }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14 }}>
            {filterStatus === 'visi' ? 'Pasūtījumu vēl nav' : 'Šajā statusā pasūtījumu nav'}
          </div>
          {filterStatus !== 'visi' && (
            <button onClick={() => setFilterStatus('visi')} style={{
              marginTop: 12, background: 'none', border: 'none',
              color: '#388bfd', fontSize: 13, cursor: 'pointer', fontFamily: F.family,
            }}>
              ← Skatīt visus
            </button>
          )}
        </div>
      ) : (
        filtreti.map(p => (
          <PasutijumaKarte
            key={p.id}
            pas={p}
            onStatusChange={onStatusChange}
            onTrackingUpdate={onTrackingUpdate}
          />
        ))
      )}
    </div>
  )
}
