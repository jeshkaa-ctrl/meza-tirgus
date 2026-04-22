import { useState, useEffect, useRef } from "react"

// Nolasa neizlasīto ziņu skaitu
const getNelasitas = (userId) => {
  if (!userId) return 0
  try {
    const msgs = JSON.parse(localStorage.getItem("chat_messages") || "[]")
    return msgs.filter(m => m.to === userId && !m.read).length
  } catch { return 0 }
}

export default function GlobalHeader({ user, onIziet, onOpenChat, onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [nelasitas, setNelasitas] = useState(0)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!user) return
    const update = () => setNelasitas(getNelasitas(user.id || user.epasts))
    update()
    const interval = setInterval(update, 3000)
    return () => clearInterval(interval)
  }, [user])

  // Aizver menu klikšķinot ārpus
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  if (!user) return null

  const vards = user.vards || user.epasts || "Lietotājs"
  const iniciāļi = vards.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      background: "linear-gradient(135deg, #1a2e1a 0%, #0f1a0f 100%)",
      borderBottom: "1px solid #2d4a2d",
      height: 48,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
    }}>

      {/* Logo */}
      <div
        onClick={() => onNavigate?.("main")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 28,
          height: 28,
          background: "linear-gradient(135deg, #2e7d32, #1b5e20)",
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
        }}>🌲</div>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#a8d8a8",
          letterSpacing: "0.03em",
        }}>Meža tirgus</span>
      </div>

      {/* Labā puse */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* Ziņu ikona */}
        <button
          onClick={() => { onOpenChat?.(); setMenuOpen(false) }}
          style={{
            position: "relative",
            background: "none",
            border: "1px solid #2d4a2d",
            borderRadius: 8,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#7ab87a",
            fontSize: 16,
          }}
        >
          ✉️
          {nelasitas > 0 && (
            <div style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#e65100",
              color: "white",
              borderRadius: "50%",
              width: 18,
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #0f1a0f",
            }}>{nelasitas > 9 ? "9+" : nelasitas}</div>
          )}
        </button>

        {/* Profila ikona + menu */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              background: menuOpen ? "#225522" : "#1a2e1a",
              border: "1px solid #3d6b3d",
              borderRadius: 8,
              height: 36,
              padding: "0 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              color: "#a8d8a8",
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              background: "linear-gradient(135deg, #2e7d32, #1b5e20)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}>{iniciāļi}</div>
            <span style={{ fontSize: 12, fontWeight: 600, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {vards}
            </span>
            <span style={{ fontSize: 10, color: "#4caf50" }}>{menuOpen ? "▲" : "▼"}</span>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              background: "#1a2e1a",
              border: "1px solid #2d4a2d",
              borderRadius: 10,
              minWidth: 200,
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              overflow: "hidden",
              zIndex: 1001,
            }}>
              {/* Profila info */}
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid #2d4a2d",
                background: "#111f11",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#a8d8a8" }}>{vards}</div>
                <div style={{ fontSize: 11, color: "#557a55", marginTop: 2 }}>{user.epasts || ""}</div>
              </div>

              {/* Menu punkti */}
              {[
                { icon: "✉️", label: "Ziņojumi", badge: nelasitas, action: () => { onOpenChat?.(); setMenuOpen(false) } },
                { icon: "🧾", label: "Mani rēķini", action: () => { onNavigate?.("rekini"); setMenuOpen(false) } },
                { icon: "📢", label: "Mani sludinājumi", action: () => { onNavigate?.("sludinajumi"); setMenuOpen(false) } },
                { icon: "🔑", label: "Mainīt paroli", action: () => { onNavigate?.("parole"); setMenuOpen(false) } },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid #1a2e1a",
                    padding: "10px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    color: "#a8d8a8",
                    fontSize: 13,
                    textAlign: "left",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#225522"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge > 0 && (
                    <span style={{
                      background: "#e65100",
                      color: "white",
                      borderRadius: 10,
                      padding: "1px 7px",
                      fontSize: 10,
                      fontWeight: 700,
                    }}>{item.badge}</span>
                  )}
                </button>
              ))}

              {/* Iziet */}
              <button
                onClick={() => { onIziet?.(); setMenuOpen(false) }}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  borderTop: "1px solid #2d4a2d",
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  color: "#e57373",
                  fontSize: 13,
                  textAlign: "left",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#1a0f0f"}
                onMouseLeave={e => e.currentTarget.style.background = "none"}
              >
                <span style={{ fontSize: 15 }}>🚪</span>
                <span>Iziet</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
