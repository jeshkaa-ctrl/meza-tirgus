import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { K, KF, KR } from './kds'
import PostsKarte from './PostsKarte'
import JaunsPostsForma from './JaunsPostsForma'
import GrupasSkats from './GrupasSkats'

const LAPU_IZMERS = 15

const CILNES = [
  { id: 'visi',       ikona: '🌿', label: 'Visi' },
  { id: 'grupas',     ikona: '👥', label: 'Grupas' },
  { id: 'sludinajumi',ikona: '📢', label: 'Sludinājumi' },
]

export default function KopienasLapa({ user, onNavigate, onReg }) {
  const [cilne,    setCilne]    = useState('visi')
  const [posti,    setPosti]    = useState([])
  const [profils,  setProfils]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [vairāk,   setVairāk]   = useState(false)
  const [ladeLairāk, setLadeVairāk] = useState(false)
  const [offset,   setOffset]   = useState(0)

  // Ielādē lietotāja profilu
  useEffect(() => {
    if (!user?.id) { setProfils(null); return }
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      .then(({ data }) => setProfils(data))
  }, [user?.id])

  const ieladePostus = useCallback(async (no = 0, tips = cilne) => {
    if (no === 0) setLoading(true)
    else setLadeVairāk(true)

    try {
      // 1. Ielādē postus
      let q = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(no, no + LAPU_IZMERS - 1)

      if (tips === 'sludinajumi') q = q.eq('tips', 'sludinajums')
      const { data: postiData, error } = await q
      if (error) throw error

      const posti = postiData || []
      if (posti.length === 0) {
        if (no === 0) setPosti([])
        setVairāk(false)
        setLoading(false)
        setLadeVairāk(false)
        return
      }

      const ids    = posti.map(p => p.id)
      const userIds = [...new Set(posti.map(p => p.user_id))]

      // 2. Paralēli: profili, likes skaits, komentāru skaits, mani likes
      const [profilsRes, likesRes, komRes, maniRes] = await Promise.all([
        supabase.from('profiles')
          .select('id, vards, uznemums, loma, novads, avatar_url')
          .in('id', userIds),
        supabase.from('post_reakcijas')
          .select('post_id')
          .in('post_id', ids),
        supabase.from('komentari')
          .select('post_id')
          .in('post_id', ids),
        user?.id
          ? supabase.from('post_reakcijas').select('post_id')
              .eq('user_id', user.id).in('post_id', ids)
          : Promise.resolve({ data: [] }),
      ])

      // 3. Apkopo datus
      const profilMap = {}
      ;(profilsRes.data || []).forEach(p => { profilMap[p.id] = p })

      const likesMap = {}
      ;(likesRes.data || []).forEach(r => {
        likesMap[r.post_id] = (likesMap[r.post_id] || 0) + 1
      })

      const komMap = {}
      ;(komRes.data || []).forEach(r => {
        komMap[r.post_id] = (komMap[r.post_id] || 0) + 1
      })

      const maniSet = new Set((maniRes.data || []).map(r => r.post_id))

      const normalizēti = posti.map(p => ({
        ...p,
        profiles:         profilMap[p.user_id] || null,
        likes_skaits:     likesMap[p.id] || 0,
        komentari_skaits: komMap[p.id] || 0,
        mans_like:        maniSet.has(p.id),
      }))

      if (no === 0) setPosti(normalizēti)
      else setPosti(prev => [...prev, ...normalizēti])

      setVairāk(normalizēti.length === LAPU_IZMERS)
      setOffset(no + normalizēti.length)
    } catch (e) {
      console.error('Kļūda ielādējot postus:', e)
    } finally {
      setLoading(false)
      setLadeVairāk(false)
    }
  }, [cilne, user?.id])

  useEffect(() => {
    if (cilne !== 'grupas') { setOffset(0); ieladePostus(0, cilne) }
  }, [cilne])

  const onJaunsPost = (post) => setPosti(prev => [{ ...post, mans_like: false }, ...prev])

  const onDelete = async (id) => {
    await supabase.from('posts').delete().eq('id', id)
    setPosti(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div style={{ minHeight: '100vh', background: K.bg, fontFamily: KF.family }}>

      {/* ── HEADER ── */}
      <header style={{
        background: K.bgCard, borderBottom: `1px solid ${K.border}`,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          maxWidth: 680, margin: '0 auto', padding: '0 16px', height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, background: K.primary,
              borderRadius: KR.md, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 16,
            }}>🌲</div>
            <div>
              <span style={{ fontSize: KF.md, fontWeight: KF.bold, color: K.text }}>Meža tirgus</span>
              <span style={{ fontSize: KF.xs, color: K.primaryMd, marginLeft: 6, fontWeight: KF.semi }}>kopiena</span>
            </div>
          </div>

          {/* Labā puse */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => onNavigate?.('main')} style={{
              background: K.primaryLt, border: `1px solid ${K.primaryMd}`,
              borderRadius: KR.full, padding: '5px 14px',
              fontSize: KF.xs, fontWeight: KF.semi, color: K.primary, cursor: 'pointer',
            }}>
              🛠 Darba virsma
            </button>
            {user
              ? <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: K.primaryLt, color: K.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: KF.xs, fontWeight: KF.bold, border: `1.5px solid ${K.primaryMd}`,
                  cursor: 'pointer',
                }}>
                  {(profils?.vards || user.epasts || '?').charAt(0).toUpperCase()}
                </div>
              : <button onClick={onReg} style={{
                  background: K.primary, color: 'white', border: 'none',
                  borderRadius: KR.full, padding: '6px 16px',
                  fontSize: KF.sm, fontWeight: KF.semi, cursor: 'pointer',
                }}>Pieslēgties</button>
            }
          </div>
        </div>

        {/* Cilnes */}
        <div style={{
          maxWidth: 680, margin: '0 auto', padding: '0 16px',
          display: 'flex', gap: 0, borderTop: `1px solid ${K.border}`,
          overflowX: 'auto',
        }}>
          {CILNES.map(c => (
            <button key={c.id} onClick={() => setCilne(c.id)} style={{
              background: 'none', border: 'none',
              borderBottom: cilne === c.id ? `2px solid ${K.primary}` : '2px solid transparent',
              color: cilne === c.id ? K.primary : K.textMut,
              padding: '10px 16px', fontSize: KF.sm,
              fontWeight: cilne === c.id ? KF.semi : KF.med,
              cursor: 'pointer', fontFamily: KF.family,
              whiteSpace: 'nowrap',
            }}>
              {c.ikona} {c.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── SATURS ── */}
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '16px 16px 80px' }}>

        {/* Jauns posts (tikai Visi un Sludinājumi tab) */}
        {cilne !== 'grupas' && user && (
          <JaunsPostsForma user={user} profils={profils} onJaunsPost={onJaunsPost} />
        )}

        {/* Nav ielogojies — aicinājums */}
        {cilne !== 'grupas' && !user && (
          <div style={{
            background: K.bgCard, border: `1px solid ${K.border}`,
            borderRadius: KR.lg, padding: '14px 16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 28 }}>🌿</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: KF.base, fontWeight: KF.semi, color: K.text }}>Pievienojies kopienai</div>
              <div style={{ fontSize: KF.sm, color: K.textSec }}>Raksti, dalies pieredzē, uzdod jautājumus</div>
            </div>
            <button onClick={onReg} style={{
              background: K.primary, color: 'white', border: 'none',
              borderRadius: KR.full, padding: '7px 18px',
              fontSize: KF.sm, fontWeight: KF.semi, cursor: 'pointer',
            }}>Pieslēgties</button>
          </div>
        )}

        {/* Grupas skats */}
        {cilne === 'grupas' && <GrupasSkats user={user} />}

        {/* Posti */}
        {cilne !== 'grupas' && (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>🌿</div>
                <div style={{ color: K.textFade, fontSize: KF.base }}>Ielādē...</div>
              </div>
            ) : posti.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: K.bgCard, borderRadius: KR.lg, border: `1px solid ${K.border}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌲</div>
                <div style={{ fontSize: KF.lg, fontWeight: KF.semi, color: K.text, marginBottom: 6 }}>
                  {cilne === 'sludinajumi' ? 'Nav sludinājumu' : 'Plūsma tukša'}
                </div>
                <div style={{ fontSize: KF.sm, color: K.textSec }}>
                  {user ? 'Esi pirmais — publicē kaut ko!' : 'Pieslēdzies lai publicētu'}
                </div>
              </div>
            ) : (
              <>
                {posti.map(p => (
                  <PostsKarte key={p.id} post={p} user={user} onDelete={onDelete} />
                ))}

                {vairāk && (
                  <button onClick={() => ieladePostus(offset)} disabled={ladeLairāk} style={{
                    width: '100%', padding: '12px', marginTop: 8,
                    background: K.bgCard, border: `1px solid ${K.border}`,
                    borderRadius: KR.md, color: K.textSec,
                    fontSize: KF.sm, cursor: ladeLairāk ? 'default' : 'pointer',
                    fontFamily: KF.family,
                  }}>
                    {ladeLairāk ? 'Ielādē...' : 'Ielādēt vairāk'}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* ── MOBILĀ APAKŠAS NAVIGĀCIJA ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: K.bgCard, borderTop: `1px solid ${K.border}`,
        display: 'flex', zIndex: 100,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
      }}>
        {[
          { id: 'visi',        ikona: '🏠', label: 'Plūsma' },
          { id: 'grupas',      ikona: '👥', label: 'Grupas' },
          { id: 'sludinajumi', ikona: '📢', label: 'Sludinājumi' },
          { id: 'darbs',       ikona: '🛠', label: 'Darbs', action: () => onNavigate?.('main') },
        ].map(n => (
          <button key={n.id} onClick={n.action || (() => setCilne(n.id))} style={{
            flex: 1, padding: '10px 4px 8px',
            background: 'none', border: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: (cilne === n.id && !n.action) ? K.primary : K.textMut,
            cursor: 'pointer', fontFamily: KF.family,
          }}>
            <span style={{ fontSize: 20 }}>{n.ikona}</span>
            <span style={{ fontSize: '10px', fontWeight: (cilne === n.id && !n.action) ? KF.semi : KF.med }}>
              {n.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  )
}
