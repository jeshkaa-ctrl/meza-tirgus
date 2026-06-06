import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { K, KF, KR, getLomaStyle, laicinsAtspalsts, iniciāļi, LOMAS_NOSAUKUMI } from './kds'

function emailPirmsAt(epasts) { return epasts ? epasts.split('@')[0] : null }
function parādītVardu(p) {
  return p?.vards || p?.uznemums || emailPirmsAt(p?.epasts) || 'Lietotājs'
}

function AvatarsBloks({ profils, izmers = 40 }) {
  const vards = parādītVardu(profils)
  const i = iniciāļi(vards)
  const lomaKrasa = profils?.loma ? getLomaStyle(profils.loma) : { bg: K.primaryLt, color: K.primary }

  if (profils?.avatar_url) {
    return (
      <img src={profils.avatar_url} alt={vards}
        style={{ width: izmers, height: izmers, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    )
  }
  return (
    <div style={{
      width: izmers, height: izmers, borderRadius: '50%', flexShrink: 0,
      background: lomaKrasa.bg, color: lomaKrasa.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: izmers < 36 ? '11px' : '13px', fontWeight: KF.bold,
      border: `1.5px solid ${lomaKrasa.border || K.border}`,
    }}>{i}</div>
  )
}

export default function PostsKarte({ post, user, onDelete }) {
  const [likes,     setLikes]     = useState(post.likes_skaits || 0)
  const [manLike,   setManLike]   = useState(post.mans_like || false)
  const [showKom,   setShowKom]   = useState(false)
  const [showFull,  setShowFull]  = useState(false)
  const [komentari, setKomentari] = useState([])
  const [komLoad,   setKomLoad]   = useState(false)
  const [jaunsKom,  setJaunsKom]  = useState('')
  const [sendKom,   setSendKom]   = useState(false)

  const profils = post.profiles || {}
  const vards   = parādītVardu(profils)
  const laiks   = laicinsAtspalsts(post.created_at)
  const irMans  = user?.id === post.user_id

  const toggleLike = async () => {
    if (!user) return
    if (manLike) {
      await supabase.from('post_reakcijas').delete().eq('post_id', post.id).eq('user_id', user.id)
      setLikes(l => l - 1); setManLike(false)
    } else {
      await supabase.from('post_reakcijas').insert({ post_id: post.id, user_id: user.id })
      setLikes(l => l + 1); setManLike(true)
    }
  }

  const ieladeKomentarus = async () => {
    if (komLoad) return
    setKomLoad(true)
    const { data: komData } = await supabase
      .from('komentari')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })

    if (komData && komData.length > 0) {
      const uids = [...new Set(komData.map(k => k.user_id))]
      const { data: profs } = await supabase
        .from('profiles').select('id, vards, uznemums, loma, avatar_url, epasts').in('id', uids)
      const pm = {}
      ;(profs || []).forEach(p => { pm[p.id] = p })
      setKomentari(komData.map(k => ({ ...k, profiles: pm[k.user_id] || null })))
    } else {
      setKomentari([])
    }
    setKomLoad(false)
  }

  const toggleKomentari = () => {
    if (!showKom && komentari.length === 0) ieladeKomentarus()
    setShowKom(v => !v)
  }

  const pievienotKomentaru = async () => {
    if (!jaunsKom.trim() || !user) return
    setSendKom(true)
    const { data } = await supabase
      .from('komentari')
      .insert({ post_id: post.id, user_id: user.id, teksts: jaunsKom.trim() })
      .select('*, profiles:user_id(vards, uznemums, loma, avatar_url, epasts)')
      .single()
    if (data) { setKomentari(p => [...p, data]); setJaunsKom('') }
    setSendKom(false)
  }

  const loma = profils.loma
  const lomaStyle = loma ? getLomaStyle(loma) : null

  return (
    <>
    <div style={{
      background: K.bgCard, border: `1px solid ${K.border}`,
      borderRadius: KR.lg, marginBottom: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      fontFamily: KF.family,
    }}>
      {/* Augša */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <AvatarsBloks profils={profils} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: KF.base, fontWeight: KF.bold, color: K.text }}>{vards}</span>
            {lomaStyle && loma && (
              <span style={{
                fontSize: KF.xs, fontWeight: KF.semi,
                background: lomaStyle.bg, color: lomaStyle.color,
                border: `1px solid ${lomaStyle.border}`,
                borderRadius: KR.full, padding: '1px 7px',
              }}>{LOMAS_NOSAUKUMI[loma] || loma}</span>
            )}
            {profils.novads && (
              <span style={{ fontSize: KF.xs, color: K.textMut }}>📍 {profils.novads}</span>
            )}
          </div>
          <div style={{ fontSize: KF.xs, color: K.textFade, marginTop: 1 }}>{laiks}</div>
        </div>
        {irMans && (
          <button onClick={() => onDelete?.(post.id)} style={{
            background: 'none', border: 'none', color: K.textFade,
            cursor: 'pointer', fontSize: 16, padding: '2px 4px',
          }} title="Dzēst">✕</button>
        )}
      </div>

      {/* Teksts */}
      <div onClick={() => setShowFull(true)} style={{ padding: '0 16px 12px', fontSize: KF.base, color: K.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', cursor: 'pointer' }}>
        {post.teksts?.length > 280 ? post.teksts.slice(0, 280) + '…' : post.teksts}
        {post.teksts?.length > 280 && (
          <span style={{ color: K.primary, fontSize: KF.sm, marginLeft: 6 }}>lasīt vairāk</span>
        )}
      </div>

      {/* Bilde */}
      {post.bilde_url && (
        <img src={post.bilde_url} alt="" style={{
          width: '100%', maxHeight: 400, objectFit: 'cover',
          borderTop: `1px solid ${K.border}`, borderBottom: `1px solid ${K.border}`,
        }} />
      )}

      {/* Apakša — darbības */}
      <div style={{
        padding: '8px 16px', display: 'flex', gap: 4,
        borderTop: `1px solid ${K.border}`,
      }}>
        <button onClick={toggleLike} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: manLike ? K.primaryLt : 'none',
          border: `1px solid ${manLike ? K.primaryMd : K.border}`,
          borderRadius: KR.full, padding: '5px 14px',
          color: manLike ? K.primary : K.textMut,
          fontSize: KF.sm, fontWeight: manLike ? KF.semi : KF.med,
          cursor: user ? 'pointer' : 'default',
        }}>
          {manLike ? '👍' : '👍'} {likes > 0 && likes}
        </button>
        <button onClick={toggleKomentari} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: showKom ? K.bgActive : 'none',
          border: `1px solid ${showKom ? K.borderMd : K.border}`,
          borderRadius: KR.full, padding: '5px 14px',
          color: K.textMut, fontSize: KF.sm, cursor: 'pointer',
        }}>
          💬 {post.komentari_skaits > 0 && post.komentari_skaits}
        </button>
        <button onClick={() => {
          const teksts = post.teksts?.slice(0, 120) + (post.teksts?.length > 120 ? '...' : '')
          const url    = encodeURIComponent(`https://www.meza-tirgus.lv/`)
          const txt    = encodeURIComponent(`🌲 Meža tirgus: ${teksts}\n${decodeURIComponent(url)}`)
          if (navigator.share) {
            navigator.share({ title: 'Meža tirgus', text: teksts, url: 'https://www.meza-tirgus.lv/' })
          } else {
            window.open(`https://wa.me/?text=${txt}`, '_blank')
          }
        }} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: `1px solid ${K.border}`,
          borderRadius: KR.full, padding: '5px 12px',
          color: K.textMut, fontSize: KF.sm, cursor: 'pointer',
        }}>📤</button>
      </div>

      {/* Komentāri */}
      {showKom && (
        <div style={{ borderTop: `1px solid ${K.border}`, padding: '12px 16px' }}>
          {komLoad && <div style={{ color: K.textFade, fontSize: KF.sm }}>Ielādē...</div>}

          {komentari.map(k => (
            <div key={k.id} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <AvatarsBloks profils={k.profiles} izmers={28} />
              <div style={{ flex: 1 }}>
                <div style={{
                  background: K.bgInput, borderRadius: KR.md,
                  padding: '8px 12px', display: 'inline-block',
                  maxWidth: '100%', border: `1px solid ${K.border}`,
                }}>
                  <div style={{ fontSize: KF.xs, fontWeight: KF.bold, color: K.textSec, marginBottom: 2 }}>
                    {parādītVardu(k.profiles)}
                  </div>
                  <div style={{ fontSize: KF.sm, color: K.text, lineHeight: 1.5 }}>{k.teksts}</div>
                </div>
              </div>
            </div>
          ))}

          {user && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <AvatarsBloks profils={{ vards: user.vards || user.epasts }} izmers={28} />
              <div style={{ flex: 1, display: 'flex', gap: 6 }}>
                <input
                  value={jaunsKom}
                  onChange={e => setJaunsKom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && pievienotKomentaru()}
                  placeholder="Raksti komentāru..."
                  style={{
                    flex: 1, background: K.bgInput, border: `1px solid ${K.border}`,
                    borderRadius: KR.full, padding: '7px 14px',
                    fontSize: KF.sm, color: K.text, outline: 'none',
                    fontFamily: KF.family,
                  }}
                />
                <button onClick={pievienotKomentaru} disabled={!jaunsKom.trim() || sendKom}
                  style={{
                    background: jaunsKom.trim() ? K.primary : K.border,
                    color: 'white', border: 'none', borderRadius: KR.full,
                    padding: '7px 16px', fontSize: KF.sm, fontWeight: KF.semi,
                    cursor: jaunsKom.trim() ? 'pointer' : 'default',
                  }}>
                  {sendKom ? '...' : '→'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Pilna skata modālis */}
    {showFull && (
      <div onClick={() => setShowFull(false)} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 0 env(safe-area-inset-bottom)',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: K.bgCard, borderRadius: `${KR.xl} ${KR.xl} 0 0`,
          width: '100%', maxWidth: 580, maxHeight: '85vh', overflowY: 'auto',
          padding: '20px 20px 32px', fontFamily: KF.family,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
        }}>
          <div style={{ width: 36, height: 4, background: K.borderMd, borderRadius: 2, margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <AvatarsBloks profils={profils} />
            <div>
              <div style={{ fontWeight: KF.bold, color: K.text, fontSize: KF.base }}>{vards}</div>
              <div style={{ fontSize: KF.xs, color: K.textFade }}>{laiks}</div>
            </div>
            <button onClick={() => setShowFull(false)} style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: K.textMut, fontSize: 22, cursor: 'pointer', lineHeight: 1,
            }}>×</button>
          </div>
          <div style={{ fontSize: KF.base, color: K.text, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
            {post.teksts}
          </div>
          {post.bilde_url && (
            <img src={post.bilde_url} alt="" style={{ width: '100%', borderRadius: KR.md, marginBottom: 16 }} />
          )}
          <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${K.border}` }}>
            <span style={{ fontSize: KF.sm, color: K.textMut }}>👍 {likes}</span>
            <span style={{ fontSize: KF.sm, color: K.textMut }}>💬 {post.komentari_skaits || 0}</span>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
