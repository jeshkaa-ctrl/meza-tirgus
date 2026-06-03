import { useState, useEffect, useRef } from "react"
import { useSubscription } from "./hooks/useSubscription"
import { supabase } from "./supabaseClient"
import { C, F, R, S, spinnerCSS } from "./ds"

const getNelasitas = (userId) => {
  if (!userId) return 0
  try {
    const msgs = JSON.parse(localStorage.getItem("chat_messages") || "[]")
    return msgs.filter(m => m.to === userId && !m.read).length
  } catch { return 0 }
}

const PLAN_LABELS  = { free: null, pro: 'Pro', business: 'Komercija' }
const PLAN_COLORS  = { free: null, pro: C.green, business: '#fbbf24' }

export default function GlobalHeader({ user, onIziet, onOpenChat, onNavigate }) {
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [nelasitas, setNelasitas] = useState(0)
  const menuRef = useRef(null)
  const { plan } = useSubscription()

  useEffect(() => {
    if (!user) return
    const update = () => {
      if (document.visibilityState === 'visible')
        setNelasitas(getNelasitas(user.id || user.epasts))
    }
    update()
    document.addEventListener('visibilitychange', update)
    const interval = setInterval(update, 30000)
    return () => {
      document.removeEventListener('visibilitychange', update)
      clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (!user) return null

  const vards    = user.vards || user.epasts || "Lietotājs"
  const iniciāļi = vards.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  const menuItems = [
    { icon: "🏠", label: "Sākumlapa",         action: () => { onNavigate?.("landing"); setMenuOpen(false) } },
    { icon: "✉️", label: "Ziņojumi",           badge: nelasitas, action: () => { onOpenChat?.(); setMenuOpen(false) } },
    { icon: "🧾", label: "Mani rēķini",        action: () => { onNavigate?.("rekini"); setMenuOpen(false) } },
    { icon: "📢", label: "Mani sludinājumi",   action: () => { onNavigate?.("sludinajumi"); setMenuOpen(false) } },
    { icon: "💳", label: plan === 'free' ? "Abonēties →" : "Abonements",
      badge: plan === 'free' ? null : PLAN_LABELS[plan],
      badgeColor: PLAN_COLORS[plan],
      action: () => { onNavigate?.("subscription"); setMenuOpen(false) } },
    { icon: "🔑", label: "Mainīt paroli",      action: () => { onNavigate?.("parole"); setMenuOpen(false) } },
  ]

  return (
    <>
      <style>{spinnerCSS}{`
        .gh-item:hover { background: ${C.greenDk} !important; }
        .gh-nav-btn:hover { background: ${C.bgInner} !important; }
      `}</style>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: C.glass, borderBottom: `1px solid ${C.greenBdr}`,
        height: 52, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 20px',
        backdropFilter: 'blur(8px)', boxShadow: '0 2px 16px rgba(0,0,0,0.4)',
        fontFamily: F.family,
      }}>

        {/* Atpakaļ uz Tirgu */}
        <button onClick={() => onNavigate?.("tirgus")} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
          color: C.textMut, fontSize: F.sm, padding: '6px 8px',
          borderRadius: R.md, opacity: 0.75, fontFamily: F.family,
          minHeight: 44, flexShrink: 0,
        }}>← Tirgus</button>

        {/* Logo */}
        <div onClick={() => onNavigate?.("landing")} style={{
          display: 'flex', alignItems: 'center', gap: S.sm, cursor: 'pointer',
        }}>
          <div style={{
            width: 30, height: 30, background: `linear-gradient(135deg, ${C.greenMd}, ${C.greenDk})`,
            borderRadius: R.md, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 16, flexShrink: 0,
          }}>🌲</div>
          <span style={{ fontSize: F.md, fontWeight: F.weightBold, color: C.textSec, letterSpacing: '0.02em' }}>
            Meža tirgus
          </span>
        </div>

        {/* Labā puse */}
        <div style={{ display: 'flex', alignItems: 'center', gap: S.sm }}>

          {/* Ziņojumi */}
          <button className="gh-nav-btn" onClick={() => { onOpenChat?.(); setMenuOpen(false) }} style={{
            position: 'relative', background: 'transparent', border: `1px solid ${C.greenBdr}`,
            borderRadius: R.md, width: 40, height: 40, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: C.textMut, fontSize: 17, transition: 'all 0.15s',
          }}>
            ✉️
            {nelasitas > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                background: '#e65100', color: 'white', borderRadius: '50%',
                width: 18, height: 18, fontSize: 10, fontWeight: F.weightBold,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${C.bg}`,
              }}>{nelasitas > 9 ? "9+" : nelasitas}</div>
            )}
          </button>

          {/* Profils */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(v => !v)} style={{
              background: menuOpen ? C.greenDk : 'transparent',
              border: `1px solid ${menuOpen ? C.green : C.greenBdr}`,
              borderRadius: R.md, height: 40, padding: '0 12px',
              display: 'flex', alignItems: 'center', gap: S.sm,
              cursor: 'pointer', color: C.textSec, transition: 'all 0.15s',
              fontFamily: F.family,
            }}>
              <div style={{
                width: 26, height: 26, background: `linear-gradient(135deg, ${C.greenMd}, ${C.greenDk})`,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: F.weightBold, color: 'white', flexShrink: 0,
              }}>{iniciāļi}</div>
              <span style={{ fontSize: F.sm, fontWeight: F.weightMed, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {vards}
              </span>
              {PLAN_LABELS[plan] && (
                <span style={{ fontSize: 9, background: PLAN_COLORS[plan], color: C.bg, padding: '1px 5px', borderRadius: R.sm, fontWeight: F.weightBold, flexShrink: 0 }}>
                  {PLAN_LABELS[plan]}
                </span>
              )}
              <span style={{ fontSize: 10, color: C.green, marginLeft: 2 }}>{menuOpen ? "▲" : "▼"}</span>
            </button>

            {menuOpen && (
              <div className="mt-fade" style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: C.bgCard, border: `1px solid ${C.greenBdrLt}`,
                borderRadius: R.lg, minWidth: 220,
                boxShadow: '0 12px 32px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 1001,
              }}>
                {/* Profila info */}
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.greenBdr}`, background: C.bgInner }}>
                  <div style={{ fontSize: F.base, fontWeight: F.weightBold, color: C.textSec }}>{vards}</div>
                  <div style={{ fontSize: F.xs, color: C.textDim, marginTop: 2 }}>{user.epasts || ""}</div>
                </div>

                {menuItems.map((item, i) => (
                  <button key={i} className="gh-item" onClick={item.action} style={{
                    width: '100%', background: 'transparent', border: 'none',
                    borderBottom: i < menuItems.length - 1 ? `1px solid ${C.greenBdr}22` : 'none',
                    padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', color: C.textSec, fontSize: F.sm, textAlign: 'left',
                    fontFamily: F.family, transition: 'background 0.1s',
                  }}>
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.badge > 0 && (
                      <span style={{ background: '#e65100', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: F.weightBold }}>
                        {item.badge}
                      </span>
                    )}
                    {item.badge && typeof item.badge === 'string' && (
                      <span style={{ fontSize: 9, background: item.badgeColor, color: C.bg, padding: '1px 5px', borderRadius: R.sm, fontWeight: F.weightBold }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}

                {/* Iziet */}
                <button onClick={() => { onIziet?.(); setMenuOpen(false) }} style={{
                  width: '100%', background: 'transparent', border: 'none',
                  borderTop: `1px solid ${C.greenBdr}`, padding: '11px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', color: C.error, fontSize: F.sm, textAlign: 'left',
                  fontFamily: F.family,
                }}>
                  <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>🚪</span>
                  <span>Iziet</span>
                </button>

                {/* Dzēst kontu */}
                <button onClick={async () => {
                  if (!window.confirm('Dzēst kontu? Visi dati tiks neatgriezeniski dzēsti.')) return
                  setMenuOpen(false)
                  await supabase.from('profiles').delete().eq('id', user.id)
                  await supabase.auth.admin?.deleteUser?.(user.id).catch(() => {})
                  await supabase.auth.signOut()
                  onIziet?.()
                }} style={{
                  width: '100%', background: 'transparent', border: 'none',
                  borderTop: `1px solid ${C.greenBdr}22`, padding: '9px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', color: C.textDim, fontSize: '11px', textAlign: 'left',
                  fontFamily: F.family,
                }}>
                  <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>🗑</span>
                  <span>Dzēst kontu</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
