import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { C, F, R, S, spinnerCSS } from './ds'

// Admin komponents — klienta iestatīšana (šoferi, piegādes vietas, uzņēmums)
// Redzams tikai adminam RpAndrasPortals cilnē

const tukšiIestatijumi = {
  uznemums_nosaukums: '',
  soferi: [],           // [{ vards: "Jānis Siņica", auto: "SH58" }]
  piegades_vietas: [],  // ["Baltic Block", "Latvāņi", ...]
  klienti: [],          // ["Klients A", "Klients B"]
}

export default function KlientuIestatijumiAdmin() {
  const [users, setUsers]           = useState([])  // visi lietotāji ar pavadzīmēm
  const [izveletaisUser, setIzv]    = useState(null)
  const [iesta, setIesta]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [saglabaSt, setSaglabaSt]   = useState('')  // '' | 'glabā' | 'saglabāts' | 'kļūda'

  // Jaunu lauku stāvokļi
  const [jaunsSoferisVards, setJSV] = useState('')
  const [jaunsSoferisAuto, setJSA]  = useState('')
  const [jaunaPiegade, setJP]       = useState('')
  const [jaunsKlients, setJK]       = useState('')

  // Ielādē unikālos user_id no pavadzīmēm + viņu iestatījumus
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data: pvz } = await supabase
        .from('pavadzimes')
        .select('user_id')

      // Unikālie user_id
      const uniq = [...new Set((pvz || []).map(r => r.user_id).filter(Boolean))]

      // Iegūst auth.users info caur Supabase (tikai admin ar service role var to darīt)
      // Pagaidām izmanto user_id kā identifikatoru + iestatījumu uzņēmuma nosaukumu
      const { data: iestaList } = await supabase
        .from('klienta_iestatijumi')
        .select('*')

      const iestaMap = {}
      ;(iestaList || []).forEach(i => { iestaMap[i.user_id] = i })

      setUsers(uniq.map(uid => ({
        id: uid,
        nosaukums: iestaMap[uid]?.uznemums_nosaukums || uid.slice(0, 8) + '...',
        irIestatijumi: !!iestaMap[uid],
        iestatijumi: iestaMap[uid] || null,
      })))
      setLoading(false)
    }
    load()
  }, [])

  const ieladeIestatijumus = async (userId) => {
    const { data } = await supabase
      .from('klienta_iestatijumi')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    setIesta(data ? {
      uznemums_nosaukums: data.uznemums_nosaukums || '',
      soferi: data.soferi || [],
      piegades_vietas: data.piegades_vietas || [],
      klienti: data.klienti || [],
    } : { ...tukšiIestatijumi })
  }

  const izveleties = (user) => {
    setIzv(user)
    setIesta(null)
    setSaglabaSt('')
    ieladeIestatijumus(user.id)
  }

  const saglabat = async () => {
    if (!izveletaisUser || !iesta) return
    setSaglabaSt('glabā')
    try {
      const { error } = await supabase
        .from('klienta_iestatijumi')
        .upsert({
          user_id: izveletaisUser.id,
          uznemums_nosaukums: iesta.uznemums_nosaukums,
          soferi: iesta.soferi,
          piegades_vietas: iesta.piegades_vietas,
          klienti: iesta.klienti || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error
      setSaglabaSt('saglabāts')
      // Atjauno lietotāju sarakstu
      setUsers(prev => prev.map(u => u.id === izveletaisUser.id
        ? { ...u, irIestatijumi: true, nosaukums: iesta.uznemums_nosaukums || u.nosaukums }
        : u
      ))
      setTimeout(() => setSaglabaSt(''), 3000)
    } catch (e) {
      setSaglabaSt('kļūda: ' + e.message)
    }
  }

  const pievienotSoferi = () => {
    if (!jaunsSoferisVards.trim()) return
    setIesta(p => ({ ...p, soferi: [...p.soferi, { vards: jaunsSoferisVards.trim(), auto: jaunsSoferisAuto.trim() }] }))
    setJSV(''); setJSA('')
  }

  const dzestSoferi = (i) => setIesta(p => ({ ...p, soferi: p.soferi.filter((_, j) => j !== i) }))

  const pievienotPiegadi = () => {
    if (!jaunaPiegade.trim()) return
    setIesta(p => ({ ...p, piegades_vietas: [...p.piegades_vietas, jaunaPiegade.trim()] }))
    setJP('')
  }

  const dzestPiegadi = (i) => setIesta(p => ({ ...p, piegades_vietas: p.piegades_vietas.filter((_, j) => j !== i) }))

  const pievienotKlientu = () => {
    if (!jaunsKlients.trim()) return
    setIesta(p => ({ ...p, klienti: [...(p.klienti||[]), jaunsKlients.trim()] }))
    setJK('')
  }

  const dzestKlientu = (i) => setIesta(p => ({ ...p, klienti: (p.klienti||[]).filter((_, j) => j !== i) }))

  const st = {
    card: { background: '#111f11', border: '1px solid #2d4a2d', borderRadius: 10, padding: 16, marginBottom: 12 },
    lbl: { fontSize: 11, color: '#81c784', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' },
    inp: { background: '#0f1a0f', border: '1px solid #2d5a2d', borderRadius: 6, color: '#e8f5e9', padding: '8px 12px', fontSize: 13, fontFamily: F.family, width: '100%', boxSizing: 'border-box' },
    chip: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a2e1a', border: '1px solid #2d5a2d', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#a8d8a8', margin: '2px' },
    xBtn: { background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 },
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#4a7a4a' }}>
      Ielādē klientus...
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 16, padding: 20, minHeight: 400 }}>
      <style>{spinnerCSS}</style>

      {/* Klientu saraksts */}
      <div style={{ width: 240, flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4caf50', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Lietotāji ({users.length})
        </div>
        {users.length === 0 && (
          <div style={{ color: '#4a7a4a', fontSize: 12, padding: 12, background: '#111f11', borderRadius: 8 }}>
            Nav reģistrētu pavadzīmju. Lietotāji parādīsies pēc pirmās skenēšanas.
          </div>
        )}
        {users.map(u => (
          <div key={u.id} onClick={() => izveleties(u)} style={{
            padding: '10px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
            background: izveletaisUser?.id === u.id ? '#1e3a1e' : '#111f11',
            border: `1px solid ${izveletaisUser?.id === u.id ? '#4caf50' : '#2d4a2d'}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e8f5e9' }}>{u.nosaukums}</div>
            <div style={{ fontSize: 10, color: u.irIestatijumi ? '#4caf50' : '#e65100', marginTop: 2 }}>
              {u.irIestatijumi ? '✓ Konfigurēts' : '⚠ Nav konfigurēts'}
            </div>
          </div>
        ))}
      </div>

      {/* Iestatīšanas panelis */}
      <div style={{ flex: 1 }}>
        {!izveletaisUser && (
          <div style={{ padding: 40, textAlign: 'center', color: '#4a7a4a', background: '#111f11', borderRadius: 10, border: '1px dashed #2d4a2d' }}>
            ← Izvēlies lietotāju no saraksta
          </div>
        )}

        {izveletaisUser && !iesta && (
          <div style={{ padding: 40, textAlign: 'center', color: '#4a7a4a' }}>Ielādē...</div>
        )}

        {izveletaisUser && iesta && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#4caf50' }}>
                ⚙️ Klienta iestatījumi
              </div>
              <button onClick={saglabat} style={{
                background: saglabaSt === 'saglabāts' ? '#1e5e1e' : '#225522',
                border: '1px solid #4caf50', borderRadius: 8,
                padding: '8px 20px', color: '#4caf50', fontSize: 13,
                fontWeight: 700, cursor: 'pointer', fontFamily: F.family,
              }}>
                {saglabaSt === 'glabā' ? '⏳ Glabā...'
                  : saglabaSt === 'saglabāts' ? '✓ Saglabāts!'
                  : '💾 Saglabāt'}
              </button>
            </div>

            {saglabaSt.startsWith('kļūda') && (
              <div style={{ background: '#3e1f1f', border: '1px solid #c62828', borderRadius: 8, padding: '8px 14px', color: '#ff6b6b', fontSize: 12, marginBottom: 12 }}>
                {saglabaSt}
              </div>
            )}

            {/* Uzņēmuma nosaukums */}
            <div style={st.card}>
              <label style={st.lbl}>Uzņēmuma nosaukums</label>
              <input value={iesta.uznemums_nosaukums} onChange={e => setIesta(p => ({ ...p, uznemums_nosaukums: e.target.value }))}
                placeholder="piemēram: SIA Meža transports"
                style={st.inp} />
            </div>

            {/* Šoferi */}
            <div style={st.card}>
              <label style={st.lbl}>Šoferi ({iesta.soferi.length})</label>
              <div style={{ marginBottom: 10, flexWrap: 'wrap', display: 'flex', gap: 4 }}>
                {iesta.soferi.map((s, i) => (
                  <span key={i} style={st.chip}>
                    {s.vards} — <span style={{ color: '#4caf50' }}>{s.auto}</span>
                    <button style={st.xBtn} onClick={() => dzestSoferi(i)}>×</button>
                  </span>
                ))}
                {iesta.soferi.length === 0 && <span style={{ color: '#4a7a4a', fontSize: 12 }}>Nav šoferu</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={jaunsSoferisVards} onChange={e => setJSV(e.target.value)}
                  placeholder="Vārds Uzvārds" style={{ ...st.inp, flex: 2 }}
                  onKeyDown={e => e.key === 'Enter' && pievienotSoferi()} />
                <input value={jaunsSoferisAuto} onChange={e => setJSA(e.target.value)}
                  placeholder="Auto nr." style={{ ...st.inp, flex: 1, width: 'auto' }}
                  onKeyDown={e => e.key === 'Enter' && pievienotSoferi()} />
                <button onClick={pievienotSoferi} style={{
                  background: '#225522', border: '1px solid #4caf50', borderRadius: 6,
                  padding: '8px 16px', color: '#4caf50', cursor: 'pointer', fontFamily: F.family, whiteSpace: 'nowrap',
                }}>+ Pievienot</button>
              </div>
            </div>

            {/* Piegādes vietas */}
            <div style={st.card}>
              <label style={st.lbl}>Piegādes vietas ({iesta.piegades_vietas.length})</label>
              <div style={{ marginBottom: 10, flexWrap: 'wrap', display: 'flex', gap: 4 }}>
                {iesta.piegades_vietas.map((v, i) => (
                  <span key={i} style={st.chip}>
                    {v}
                    <button style={st.xBtn} onClick={() => dzestPiegadi(i)}>×</button>
                  </span>
                ))}
                {iesta.piegades_vietas.length === 0 && <span style={{ color: '#4a7a4a', fontSize: 12 }}>Nav piegādes vietu</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={jaunaPiegade} onChange={e => setJP(e.target.value)}
                  placeholder="piemēram: Baltic Block, Latvāņi..."
                  style={{ ...st.inp, flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && pievienotPiegadi()} />
                <button onClick={pievienotPiegadi} style={{
                  background: '#225522', border: '1px solid #4caf50', borderRadius: 6,
                  padding: '8px 16px', color: '#4caf50', cursor: 'pointer', fontFamily: F.family,
                }}>+</button>
              </div>
            </div>

            {/* Klienti */}
            <div style={st.card}>
              <label style={st.lbl}>Klienti / Pakalpojumu saņēmēji ({(iesta.klienti||[]).length})</label>
              <div style={{ marginBottom: 10, flexWrap: 'wrap', display: 'flex', gap: 4 }}>
                {(iesta.klienti||[]).map((k, i) => (
                  <span key={i} style={st.chip}>
                    {k}
                    <button style={st.xBtn} onClick={() => dzestKlientu(i)}>×</button>
                  </span>
                ))}
                {!(iesta.klienti||[]).length && <span style={{ color: '#4a7a4a', fontSize: 12 }}>Nav klientu</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={jaunsKlients} onChange={e => setJK(e.target.value)}
                  placeholder="Klienta nosaukums..."
                  style={{ ...st.inp, flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && pievienotKlientu()} />
                <button onClick={pievienotKlientu} style={{
                  background: '#225522', border: '1px solid #4caf50', borderRadius: 6,
                  padding: '8px 16px', color: '#4caf50', cursor: 'pointer', fontFamily: F.family,
                }}>+</button>
              </div>
            </div>

            <div style={{ fontSize: 11, color: '#4a7a4a', textAlign: 'center', marginTop: 8 }}>
              User ID: {izveletaisUser.id}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
