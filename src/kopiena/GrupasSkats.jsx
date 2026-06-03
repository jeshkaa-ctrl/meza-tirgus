import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { K, KF, KR } from './kds'

function GrupasKarte({ grupa, user, onPievienoties }) {
  const [pievienojies, setPievienojies] = useState(false)
  const [loading, setLoading] = useState(false)

  const pievienoties = async () => {
    if (!user || loading) return
    setLoading(true)
    if (pievienojies) {
      await supabase.from('grupas_dalibnieki').delete()
        .eq('grupa_id', grupa.id).eq('user_id', user.id)
      setPievienojies(false)
    } else {
      await supabase.from('grupas_dalibnieki').insert({ grupa_id: grupa.id, user_id: user.id })
      setPievienojies(true)
    }
    setLoading(false)
  }

  return (
    <div style={{
      background: K.bgCard, border: `1px solid ${K.border}`,
      borderRadius: KR.lg, padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: KF.base, fontWeight: KF.bold, color: K.text, marginBottom: 3 }}>
            {grupa.tips === 'privata' ? '🔒 ' : '🌿 '}{grupa.nosaukums}
          </div>
          {grupa.apraksts && (
            <div style={{ fontSize: KF.sm, color: K.textSec, lineHeight: 1.5 }}>{grupa.apraksts}</div>
          )}
        </div>
        {user && (
          <button onClick={pievienoties} style={{
            background: pievienojies ? K.bgActive : K.primaryLt,
            color: K.primary, border: `1px solid ${pievienojies ? K.primaryMd : K.border}`,
            borderRadius: KR.full, padding: '6px 14px', fontSize: KF.xs,
            fontWeight: KF.semi, cursor: 'pointer', flexShrink: 0, marginLeft: 8,
          }}>
            {loading ? '...' : pievienojies ? '✓ Dalībnieks' : '+ Pievienoties'}
          </button>
        )}
      </div>
      <div style={{ fontSize: KF.xs, color: K.textFade }}>
        {grupa.tips === 'privata' ? '🔒 Privāta' : '🌍 Publiska'} grupa
      </div>
    </div>
  )
}

export default function GrupasSkats({ user, onReg }) {
  const [grupas, setGrupas]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForma, setShowForma] = useState(false)
  const [jaunaGrupa, setJaunaGrupa] = useState({ nosaukums: '', apraksts: '', tips: 'publiska' })
  const [veido, setVeido]       = useState(false)

  useEffect(() => {
    supabase.from('grupas').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setGrupas(data || []); setLoading(false) })
  }, [])

  const izveidotGrupu = async () => {
    if (!jaunaGrupa.nosaukums.trim() || !user) return
    setVeido(true)
    const { data } = await supabase.from('grupas')
      .insert({ ...jaunaGrupa, izveidoja: user.id })
      .select().single()
    if (data) {
      setGrupas(p => [data, ...p])
      setJaunaGrupa({ nosaukums: '', apraksts: '', tips: 'publiska' })
      setShowForma(false)
    }
    setVeido(false)
  }

  const inp = {
    background: K.bgInput, border: `1px solid ${K.border}`,
    borderRadius: KR.md, padding: '9px 12px',
    fontSize: KF.base, color: K.text, fontFamily: KF.family,
    width: '100%', boxSizing: 'border-box', outline: 'none',
  }

  return (
    <div>
      {/* Nav pieslēdzies */}
      {!user && (
        <div style={{
          background: K.bgCard, border: `1px solid ${K.border}`,
          borderRadius: KR.lg, padding: '14px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 28 }}>👥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: KF.base, fontWeight: KF.semi, color: K.text }}>Pieslēdzies lai izveidotu grupu</div>
            <div style={{ fontSize: KF.sm, color: K.textSec }}>Apvieno meža cilvēkus pēc reģiona vai intereses</div>
          </div>
          <button onClick={onReg} style={{
            background: K.primary, color: 'white', border: 'none',
            borderRadius: KR.full, padding: '7px 18px',
            fontSize: KF.sm, fontWeight: KF.semi, cursor: 'pointer',
          }}>Pieslēgties</button>
        </div>
      )}

      {/* Jauna grupa forma */}
      {user && (
        <div style={{ marginBottom: 16 }}>
          {!showForma ? (
            <button onClick={() => setShowForma(true)} style={{
              width: '100%', background: K.bgCard, border: `1.5px dashed ${K.borderMd}`,
              borderRadius: KR.lg, padding: '14px', color: K.textSec,
              fontSize: KF.base, cursor: 'pointer', fontFamily: KF.family,
            }}>
              + Izveidot jaunu grupu
            </button>
          ) : (
            <div style={{ background: K.bgCard, border: `1px solid ${K.primaryMd}`, borderRadius: KR.lg, padding: 16 }}>
              <div style={{ fontSize: KF.base, fontWeight: KF.semi, color: K.text, marginBottom: 12 }}>Jauna grupa</div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: KF.xs, color: K.textSec, fontWeight: KF.semi, display: 'block', marginBottom: 4 }}>Nosaukums *</label>
                <input value={jaunaGrupa.nosaukums} onChange={e => setJaunaGrupa(p => ({ ...p, nosaukums: e.target.value }))}
                  placeholder="piemēram: Vidzemes meža īpašnieki" style={inp} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: KF.xs, color: K.textSec, fontWeight: KF.semi, display: 'block', marginBottom: 4 }}>Apraksts</label>
                <textarea value={jaunaGrupa.apraksts} onChange={e => setJaunaGrupa(p => ({ ...p, apraksts: e.target.value }))}
                  placeholder="Par ko ir šī grupa?" rows={2}
                  style={{ ...inp, resize: 'none' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: KF.xs, color: K.textSec, fontWeight: KF.semi, display: 'block', marginBottom: 6 }}>Veids</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['publiska', '🌍 Publiska'], ['privata', '🔒 Privāta']].map(([v, l]) => (
                    <button key={v} onClick={() => setJaunaGrupa(p => ({ ...p, tips: v }))} style={{
                      flex: 1, padding: '8px', borderRadius: KR.md, cursor: 'pointer',
                      background: jaunaGrupa.tips === v ? K.primaryLt : K.bgInput,
                      border: `1px solid ${jaunaGrupa.tips === v ? K.primaryMd : K.border}`,
                      color: jaunaGrupa.tips === v ? K.primary : K.textSec,
                      fontSize: KF.sm, fontWeight: jaunaGrupa.tips === v ? KF.semi : KF.med,
                    }}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowForma(false)} style={{
                  flex: 1, padding: '9px', background: 'none', border: `1px solid ${K.border}`,
                  borderRadius: KR.md, color: K.textMut, fontSize: KF.sm, cursor: 'pointer',
                }}>Atcelt</button>
                <button onClick={izveidotGrupu} disabled={!jaunaGrupa.nosaukums.trim() || veido} style={{
                  flex: 2, padding: '9px', background: jaunaGrupa.nosaukums.trim() ? K.primary : K.border,
                  border: 'none', borderRadius: KR.md, color: 'white',
                  fontSize: KF.sm, fontWeight: KF.semi, cursor: jaunaGrupa.nosaukums.trim() ? 'pointer' : 'default',
                }}>
                  {veido ? 'Veido...' : '✓ Izveidot grupu'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 40, color: K.textFade }}>Ielādē grupas...</div>}

      {!loading && grupas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: K.textFade }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
          <div style={{ fontSize: KF.base }}>Grupas vēl nav. Izveido pirmo!</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {grupas.map(g => <GrupasKarte key={g.id} grupa={g} user={user} />)}
      </div>
    </div>
  )
}
