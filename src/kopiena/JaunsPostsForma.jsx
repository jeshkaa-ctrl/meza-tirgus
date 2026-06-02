import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { K, KF, KR, iniciāļi, getLomaStyle } from './kds'

function Avatars({ profils, izmers = 40 }) {
  const v = profils?.vards || profils?.uznemums || '?'
  const ls = profils?.loma ? getLomaStyle(profils.loma) : { bg: K.primaryLt, color: K.primary }
  if (profils?.avatar_url) {
    return <img src={profils.avatar_url} alt="" style={{ width: izmers, height: izmers, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: izmers, height: izmers, borderRadius: '50%', flexShrink: 0,
      background: ls.bg, color: ls.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: KF.bold, border: `1.5px solid ${ls.border || K.border}`,
    }}>{iniciāļi(v)}</div>
  )
}

export default function JaunsPostsForma({ user, profils, onJaunsPost }) {
  const [teksts,   setTeksts]   = useState('')
  const [bilde,    setBilde]    = useState(null)  // { url, file }
  const [posting,  setPosting]  = useState(false)
  const [aktiva,   setAktiva]   = useState(false)
  const fileRef = useRef()

  const handleBilde = (file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setBilde({ url, file })
  }

  const publicet = async () => {
    if (!teksts.trim() || !user) return
    setPosting(true)

    let bilde_url = null
    if (bilde?.file) {
      const ext  = bilde.file.name.split('.').pop()
      const path = `posts/${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('post-bildes')
        .upload(path, bilde.file)
      if (!uploadErr) {
        const { data } = supabase.storage.from('post-bildes').getPublicUrl(path)
        bilde_url = data?.publicUrl
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, teksts: teksts.trim(), bilde_url })
      .select('*')
      .single()

    if (!error && data) {
      // Pievieno profilu lokāli — nav nepieciešams papildu query
      onJaunsPost?.({ ...data, profiles: profils, likes_skaits: 0, komentari_skaits: 0, mans_like: false })
      setTeksts(''); setBilde(null); setAktiva(false)
    }
    setPosting(false)
  }

  if (!user) return null

  return (
    <div style={{
      background: K.bgCard, border: `1px solid ${K.border}`,
      borderRadius: KR.lg, marginBottom: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      fontFamily: KF.family,
    }}>
      <div style={{ padding: '12px 14px', display: 'flex', gap: 10 }}>
        <Avatars profils={profils} />
        <div style={{ flex: 1 }}>
          <textarea
            value={teksts}
            onChange={e => setTeksts(e.target.value)}
            onFocus={() => setAktiva(true)}
            placeholder="Ko ievērojāt mežā? Dalīties pieredzē, jautājumā vai padomā..."
            rows={aktiva ? 3 : 1}
            style={{
              width: '100%', resize: 'none', border: `1px solid ${aktiva ? K.primaryMd : K.border}`,
              borderRadius: KR.md, padding: '9px 12px',
              background: K.bgInput, color: K.text,
              fontSize: KF.base, fontFamily: KF.family,
              outline: 'none', lineHeight: 1.5,
              transition: 'border-color 0.15s, height 0.15s',
              boxSizing: 'border-box',
            }}
          />

          {/* Bilde preview */}
          {bilde && (
            <div style={{ position: 'relative', marginTop: 8, display: 'inline-block' }}>
              <img src={bilde.url} alt="" style={{ maxHeight: 180, maxWidth: '100%', borderRadius: KR.md, border: `1px solid ${K.border}` }} />
              <button onClick={() => setBilde(null)} style={{
                position: 'absolute', top: 4, right: 4,
                background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12,
              }}>×</button>
            </div>
          )}
        </div>
      </div>

      {aktiva && (
        <div style={{
          borderTop: `1px solid ${K.border}`, padding: '8px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => fileRef.current?.click()} style={{
              background: K.bgHover, border: `1px solid ${K.border}`,
              borderRadius: KR.full, padding: '5px 12px',
              fontSize: KF.sm, color: K.textSec, cursor: 'pointer',
            }}>📷 Bilde</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleBilde(e.target.files[0])} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => { setAktiva(false); setTeksts(''); setBilde(null) }} style={{
              background: 'none', border: 'none', color: K.textMut,
              fontSize: KF.sm, cursor: 'pointer', padding: '5px 8px',
            }}>Atcelt</button>
            <button onClick={publicet} disabled={!teksts.trim() || posting} style={{
              background: teksts.trim() && !posting ? K.primary : K.border,
              color: 'white', border: 'none', borderRadius: KR.full,
              padding: '7px 20px', fontSize: KF.sm, fontWeight: KF.semi,
              cursor: teksts.trim() && !posting ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}>
              {posting ? 'Publicē...' : 'Publicēt'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
