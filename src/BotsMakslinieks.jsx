import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { acmHeaders } from './utils/acm'

const KATEGORIJAS = [
  { id: 'bears',       label: '🐻 Lāči / Medības' },
  { id: 'ticks',       label: '🦟 Ērču aizsardzība' },
  { id: 'boots',       label: '👢 Apavi / Aizsardzība' },
  { id: 'measurement', label: '📏 Mērinstrumenti' },
  { id: 'surveillance',label: '📷 Novērošana' },
  { id: 'safety',      label: '🦺 Drošība mežā' },
]

function calcPrices(buy, del, mar) {
  if (!buy) return null
  const customs = buy > 150 ? buy * 0.05 : 0
  const base = buy + del + customs
  const pvn = base * 0.21
  const cost = base + pvn
  const profitMargin = cost * (mar / 100)
  const sell = Math.ceil((cost + profitMargin) / 0.5) * 0.5
  const netProfit = sell - cost - sell * 0.21
  return { customs, base, pvn, cost, profitMargin, sell, netProfit }
}

const S = {
  label:   { color: '#8b949e', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 },
  input:   { background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: '9px 12px', color: '#e6edf3', fontSize: 13, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' },
  calcRow: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8b949e', padding: '3px 0', borderBottom: '1px solid #21262d' },
}

const SYSTEM_PROMPT = `Tu esi e-veikala produktu speciālists Latvijā. Meža Tirgus pārdod āra aktivitāšu un meža drošības piederumus.

NOSAUKUMA NOTEIKUMI:
- Veido unikālu latvisko nosaukumu ko nevar izsekot pie oriģināla
- Ja zīmols ir pazīstams (Husqvarna, Garmin, Leatherman u.c.) — saglabā zīmolu, veido jaunu nosaukumu
- Nepazīstamu zīmolu NEMIN
- NEKAD neizmanto modeļu numurus vai oriģinālos nosaukumus

Atgriez TIKAI derīgu JSON bez markdown vai komentāriem:
{
  "name_lv": "Unikāls latviskais nosaukums",
  "tagline": "Viens teikums — galvenais ieguvums",
  "description_lv": "Pilns apraksts 3-4 rindkopās latviski. Praktisks, bez superlatīviem.",
  "features": [{"icon":"🎯","text":"Iezīme"},{"icon":"🔋","text":"Iezīme"},{"icon":"💧","text":"Iezīme"},{"icon":"⚡","text":"Iezīme"},{"icon":"🏔","text":"Iezīme"},{"icon":"📦","text":"Komplektācija"}],
  "technical_params": {"Svars":"...","Izmēri":"...","Materiāls":"..."},
  "seo_keywords": ["atslēgvārds1","atslēgvārds2","atslēgvārds3","atslēgvārds4"],
  "delivery_info": "Piegāde 7-21 darba dienas",
  "dalle_prompt": "DALL-E 3 prompt in English: vivid advertising poster for this product, dramatic outdoor/forest/hunting scene, professional lighting, high contrast colors, cinematic quality, product prominently featured"
}`

export default function BotsMakslinieks({ initialData }) {
  const [url,       setUrl]       = useState('')
  const [buyPrice,  setBuyPrice]  = useState('')
  const [delivery,  setDelivery]  = useState('12')
  const [margin,    setMargin]    = useState(100)
  const [brand,     setBrand]     = useState('')
  const [category,  setCategory]  = useState('bears')
  const [imageUrls, setImageUrls] = useState(['', ''])
  const [extra,     setExtra]     = useState('')

  const [aiData,    setAiData]    = useState(null)
  const [posterUrl, setPosterUrl] = useState(null)

  const [genLoading,  setGenLoading]  = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [genStatus,   setGenStatus]   = useState('')
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    if (!initialData) return
    if (initialData.url)      setUrl(initialData.url)
    if (initialData.price)    setBuyPrice(String(initialData.price))
    if (initialData.delivery) setDelivery(String(initialData.delivery))
    if (initialData.category) setCategory(initialData.category)
  }, [initialData])

  const prices = calcPrices(parseFloat(buyPrice) || 0, parseFloat(delivery) || 0, margin)

  async function generate() {
    if (!url.trim() && !extra.trim()) { setError('Ievadi produkta URL vai aprakstu'); return }
    setGenLoading(true); setError(''); setAiData(null); setPosterUrl(null); setSaved(false)

    try {
      setGenStatus('Claude ģenerē aprakstu...')
      const katName = KATEGORIJAS.find(k => k.id === category)?.label || category
      const userPrompt = [
        `Produkts: ${url || extra}`,
        `Kategorija: ${katName}`,
        brand ? `Zīmols: ${brand}` : '',
        buyPrice ? `Pirkšanas cena: ${buyPrice}€ · Pārdošanas cena: ${prices?.sell?.toFixed(2)}€` : '',
        extra && url ? `Papildu info: ${extra}` : '',
      ].filter(Boolean).join('\n')

      const resp = await fetch('/api/anthropic/v1/messages', {
        method: 'POST',
        headers: acmHeaders(),
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })
      if (!resp.ok) {
        const t = await resp.text().catch(() => '')
        throw new Error(`Claude kļūda ${resp.status}: ${t.slice(0, 120)}`)
      }
      const rd = await resp.json()
      const text = rd.content?.map(c => c.text || '').join('').replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)
      setAiData(parsed)

      // DALL-E plakāts
      setGenStatus('DALL-E ģenerē plakātu...')
      const dalleResp = await fetch('/api/openai-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: parsed.dalle_prompt || `Vivid professional outdoor product poster, ${category} theme, dramatic forest lighting`,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
        }),
      })
      if (dalleResp.ok) {
        const dd = await dalleResp.json()
        const imgUrl = dd.data?.[0]?.url
          || (dd.data?.[0]?.b64_json ? `data:image/png;base64,${dd.data[0].b64_json}` : null)
        if (imgUrl) setPosterUrl(imgUrl)
      } else {
        const de = await dalleResp.json().catch(() => ({}))
        setError(`DALL-E: ${de.error?.message || dalleResp.status} (apraksts saglabāts)`)
      }
    } catch(e) {
      setError(e.message)
    } finally {
      setGenLoading(false); setGenStatus('')
    }
  }

  async function saglabat() {
    if (!aiData) { setError('Vispirms ģenerē produktu'); return }
    setSaveLoading(true); setError('')
    try {
      const imgs = imageUrls.filter(u => u.trim())
      const { error: sbErr } = await supabase.from('products').insert({
        name_lv:          aiData.name_lv,
        tagline:          aiData.tagline,
        description_lv:   aiData.description_lv,
        features:         aiData.features || [],
        image_url:        posterUrl || imgs[0] || null,
        extra_images:     imgs,
        price_sell:       prices?.sell || 0,
        price_buy:        parseFloat(buyPrice) || 0,
        profit:           prices?.netProfit || 0,
        category,
        brand:            brand || null,
        delivery_info:    aiData.delivery_info || 'Piegāde 7-21 darba dienas',
        seo_keywords:     aiData.seo_keywords || [],
        technical_params: aiData.technical_params || {},
        original_url:     url || null,
        active:           true,
      })
      if (sbErr) throw new Error(sbErr.message)
      setSaved(true)
    } catch(e) {
      setError(e.message)
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

        {/* KREISĀ PUSE — FORMA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ color: '#388bfd', fontWeight: 700, fontSize: 15 }}>🎨 Produkta pievienošana</div>

          <div>
            <label style={S.label}>Produkta URL (AliExpress / Amazon)</label>
            <textarea value={url} onChange={e => setUrl(e.target.value)} rows={2}
              placeholder="https://aliexpress.com/item/..."
              style={{ ...S.input, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Pirkšanas cena (€)</label>
              <input type="number" value={buyPrice} onChange={e => setBuyPrice(e.target.value)}
                placeholder="6.10" step="0.01" style={S.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Piegāde (€)</label>
              <input type="number" value={delivery} onChange={e => setDelivery(e.target.value)}
                placeholder="12" step="0.01" style={S.input} />
            </div>
          </div>

          <div>
            <label style={S.label}>Marža: {margin}%</label>
            <input type="range" min={20} max={300} value={margin}
              onChange={e => setMargin(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#388bfd', cursor: 'pointer' }} />
          </div>

          {prices && (
            <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '10px 14px' }}>
              <div style={S.calcRow}><span>Muita (5%)</span><span>{prices.customs > 0 ? prices.customs.toFixed(2) + ' €' : '0 €'}</span></div>
              <div style={S.calcRow}><span>PVN imports (21%)</span><span>{prices.pvn.toFixed(2)} €</span></div>
              <div style={S.calcRow}><span>Pašizmaksa</span><span>{prices.cost.toFixed(2)} €</span></div>
              <div style={S.calcRow}><span>Marža ({margin}%)</span><span>{prices.profitMargin.toFixed(2)} €</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#4caf50', padding: '8px 0 2px' }}>
                <span>PĀRDOŠANAS CENA</span><span>{prices.sell.toFixed(2)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#f85149' }}>
                <span>Tīrā peļņa/gab</span><span>{prices.netProfit.toFixed(2)} €</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Ražotājs / Zīmols</label>
              <input value={brand} onChange={e => setBrand(e.target.value)}
                placeholder="Husqvarna, Garmin..." style={S.input} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={S.label}>Kategorija</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ ...S.input, cursor: 'pointer' }}>
                {KATEGORIJAS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={S.label}>Reālās preces bildes (URL)</label>
            {imageUrls.map((u, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={u} onChange={e => { const a = [...imageUrls]; a[i] = e.target.value; setImageUrls(a) }}
                  placeholder={`Bilde ${i + 1} URL...`}
                  style={{ ...S.input, flex: 1 }} />
                {imageUrls.length > 1 && (
                  <button onClick={() => setImageUrls(imageUrls.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: '1px solid #30363d', borderRadius: 6, color: '#f85149', cursor: 'pointer', padding: '0 10px', fontSize: 18, fontFamily: 'inherit' }}>×</button>
                )}
              </div>
            ))}
            <button onClick={() => setImageUrls([...imageUrls, ''])}
              style={{ background: 'none', border: '1px solid #30363d', borderRadius: 6, color: '#388bfd', fontSize: 12, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Pievienot bildi
            </button>
          </div>

          <div>
            <label style={S.label}>Papildu info (neobligāti)</label>
            <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={2}
              placeholder="Atsauksmes, izmēri, īpašības..."
              style={{ ...S.input, resize: 'vertical' }} />
          </div>

          {error && (
            <div style={{ color: '#f85149', fontSize: 12, background: '#1a0000', border: '1px solid #3a0000', borderRadius: 6, padding: 10 }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={generate} disabled={genLoading}
            style={{ padding: '12px 20px', borderRadius: 8, border: '2px solid #388bfd', background: genLoading ? '#21262d' : '#1c2d3f', color: genLoading ? '#8b949e' : '#388bfd', fontWeight: 700, fontSize: 14, cursor: genLoading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            {genLoading ? (genStatus || 'Ģenerē...') : '🤖 Ģenerēt'}
          </button>

          {aiData && (
            <button onClick={saglabat} disabled={saveLoading || saved}
              style={{ padding: '12px 20px', borderRadius: 8, border: `2px solid ${saved ? '#4caf50' : '#2d6a2d'}`, background: '#0d1a0d', color: saved ? '#4caf50' : '#81c784', fontWeight: 700, fontSize: 14, cursor: saved || saveLoading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {saved ? '✓ Saglabāts veikalā!' : saveLoading ? 'Saglabā...' : '💾 Saglabāt veikalā'}
            </button>
          )}
        </div>

        {/* LABĀ PUSE — PRIEKŠSKATĪJUMS */}
        <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 10, padding: 20, minHeight: 300 }}>
          {!aiData && !genLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260, flexDirection: 'column', gap: 12, color: '#484f58' }}>
              <div style={{ fontSize: 52 }}>🎨</div>
              <div style={{ fontSize: 13 }}>Aizpildi formu un spiez "Ģenerēt"</div>
            </div>
          )}

          {genLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260, flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 36, height: 36, border: '3px solid #21262d', borderTop: '3px solid #388bfd', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ color: '#8b949e', fontSize: 12 }}>{genStatus}</div>
            </div>
          )}

          {aiData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {posterUrl && (
                <img src={posterUrl} alt="AI plakāts"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #21262d' }} />
              )}
              {!posterUrl && imageUrls.filter(u => u.trim())[0] && (
                <img src={imageUrls.filter(u => u.trim())[0]} alt="Preces bilde"
                  style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 8, border: '1px solid #21262d' }} />
              )}

              <div style={{ color: '#e6edf3', fontWeight: 800, fontSize: 18 }}>{aiData.name_lv}</div>
              <div style={{ color: '#8b949e', fontSize: 13, fontStyle: 'italic' }}>{aiData.tagline}</div>
              <div style={{ color: '#e6edf3', fontSize: 12, lineHeight: 1.75 }}>{aiData.description_lv}</div>

              {aiData.features?.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {aiData.features.map((f, i) => (
                    <div key={i} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#8b949e' }}>
                      {f.icon} {f.text}
                    </div>
                  ))}
                </div>
              )}

              {aiData.technical_params && Object.keys(aiData.technical_params).length > 0 && (
                <div>
                  <div style={{ ...S.label, marginBottom: 8 }}>Tehniskie parametri</div>
                  {Object.entries(aiData.technical_params).map(([k, v]) => (
                    <div key={k} style={S.calcRow}>
                      <span>{k}</span>
                      <span style={{ color: '#e6edf3' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiData.seo_keywords?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {aiData.seo_keywords.map((kw, i) => (
                    <span key={i} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '2px 8px', fontSize: 10, color: '#8b949e' }}>{kw}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
