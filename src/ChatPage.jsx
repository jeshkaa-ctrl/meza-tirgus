import { useState, useEffect, useRef } from "react"

// ── localStorage helpers ──────────────────────────────────────────────────────
const getMessages = () => {
  try { return JSON.parse(localStorage.getItem("chat_messages") || "[]") } catch { return [] }
}

const saveMessages = (msgs) => {
  try { localStorage.setItem("chat_messages", JSON.stringify(msgs)) } catch {}
}

const getUsers = () => {
  try { return JSON.parse(localStorage.getItem("registered_users") || "[]") } catch { return [] }
}

const markAsRead = (userId, fromId) => {
  const msgs = getMessages()
  const updated = msgs.map(m =>
    m.to === userId && m.from === fromId ? { ...m, read: true } : m
  )
  saveMessages(updated)
}

// ── Stili ─────────────────────────────────────────────────────────────────────
const s = {
  page: {
    background: "#0f1a0f",
    minHeight: "100vh",
    color: "#e8f0e8",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    paddingTop: 48,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#1a2e1a",
    borderBottom: "1px solid #2d4a2d",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    background: "none",
    border: "1px solid #3d6b3d",
    color: "#7ab87a",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 13,
    cursor: "pointer",
  },
  container: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 48px - 57px)",
  },
  // Lietotāju saraksts
  sidebar: {
    width: 260,
    borderRight: "1px solid #2d4a2d",
    background: "#111f11",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  },
  sidebarHead: {
    padding: "14px 16px",
    fontSize: 11,
    fontWeight: 700,
    color: "#557a55",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    borderBottom: "1px solid #2d4a2d",
  },
  userItem: (active, hasUnread) => ({
    padding: "12px 16px",
    borderBottom: "1px solid #1a2e1a",
    cursor: "pointer",
    background: active ? "#225522" : "none",
    display: "flex",
    alignItems: "center",
    gap: 10,
    transition: "background 0.15s",
  }),
  avatar: (color) => ({
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: color || "linear-gradient(135deg, #2e7d32, #1b5e20)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    color: "white",
    flexShrink: 0,
  }),
  // Čata logs
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#0f1a0f",
  },
  chatHeader: {
    padding: "12px 20px",
    borderBottom: "1px solid #2d4a2d",
    background: "#1a2e1a",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  msgBubble: (isMine) => ({
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
    background: isMine ? "linear-gradient(135deg, #2e7d32, #1b5e20)" : "#1a2e1a",
    color: isMine ? "white" : "#e8f0e8",
    alignSelf: isMine ? "flex-end" : "flex-start",
    border: isMine ? "none" : "1px solid #2d4a2d",
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
  }),
  msgTime: (isMine) => ({
    fontSize: 10,
    color: isMine ? "rgba(255,255,255,0.6)" : "#557a55",
    marginTop: 4,
    textAlign: isMine ? "right" : "left",
  }),
  inputArea: {
    padding: "12px 16px",
    borderTop: "1px solid #2d4a2d",
    background: "#1a2e1a",
    display: "flex",
    gap: 8,
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    background: "#0f1a0f",
    border: "1px solid #3d6b3d",
    borderRadius: 10,
    color: "#e8f0e8",
    padding: "10px 14px",
    fontSize: 14,
    resize: "none",
    outline: "none",
    minHeight: 42,
    maxHeight: 120,
    lineHeight: 1.5,
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #2e7d32, #1b5e20)",
    border: "none",
    borderRadius: 10,
    color: "white",
    width: 42,
    height: 42,
    fontSize: 18,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  empty: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 12,
    color: "#557a55",
  },
  downloadBtn: {
    background: "none",
    border: "1px solid #3d6b3d",
    borderRadius: 8,
    color: "#7ab87a",
    padding: "6px 12px",
    fontSize: 12,
    cursor: "pointer",
  },
}

// ── Avatara krāsa pēc vārda ───────────────────────────────────────────────────
const avatarColor = (name) => {
  const colors = [
    "linear-gradient(135deg, #2e7d32, #1b5e20)",
    "linear-gradient(135deg, #1565c0, #0d47a1)",
    "linear-gradient(135deg, #6a1b9a, #4a148c)",
    "linear-gradient(135deg, #e65100, #bf360c)",
    "linear-gradient(135deg, #00695c, #004d40)",
    "linear-gradient(135deg, #558b2f, #33691e)",
  ]
  const i = (name || "").charCodeAt(0) % colors.length
  return colors[i]
}

const iniciāļi = (name) =>
  (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

const formatTime = (ts) => {
  const d = new Date(ts)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit" }) + " " +
    d.toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit" })
}

// ── GALVENAIS KOMPONENTS ──────────────────────────────────────────────────────
export default function ChatPage({ user, onBack }) {
  const [messages, setMessages] = useState(getMessages())
  const [activeUser, setActiveUser] = useState(null)
  const [text, setText] = useState("")
  const [jauns, setJauns] = useState(false) // jauna sarakste
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const myId = user?.id || user?.epasts || ""
  const myName = user?.vards || user?.epasts || "Es"

  // Atjaunina ziņas ik 3s (polling)
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(getMessages())
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Scroll uz leju
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeUser])

  // Atzīmē kā izlasītu
  useEffect(() => {
    if (activeUser) {
      markAsRead(myId, activeUser.id)
      setMessages(getMessages())
    }
  }, [activeUser, myId])

  // Visi lietotāji ar kuriem ir sarakste VAI no reģistrētiem
  const allUsers = getUsers().filter(u => (u.id || u.epasts) !== myId)

  // Sarakstes partneri — lietotāji ar kuriem ir ziņas
  const sarakstePartneri = new Set(
    messages
      .filter(m => m.from === myId || m.to === myId)
      .map(m => m.from === myId ? m.to : m.from)
  )

  // Apvienojam — partneri + visi pārējie
  const displayUsers = [
    ...allUsers.filter(u => sarakstePartneri.has(u.id || u.epasts)),
    ...allUsers.filter(u => !sarakstePartneri.has(u.id || u.epasts)),
  ]

  // Pašreizējā sarakstes ziņas
  const currentMsgs = activeUser
    ? messages.filter(m =>
        (m.from === myId && m.to === (activeUser.id || activeUser.epasts)) ||
        (m.to === myId && m.from === (activeUser.id || activeUser.epasts))
      ).sort((a, b) => a.ts - b.ts)
    : []

  // Neizlasīto skaits konkrētam lietotājam
  const unreadFrom = (userId) =>
    messages.filter(m => m.from === userId && m.to === myId && !m.read).length

  // Sūta ziņu
  const sutat = () => {
    if (!text.trim() || !activeUser) return
    const msg = {
      id: Date.now() + Math.random(),
      from: myId,
      fromName: myName,
      to: activeUser.id || activeUser.epasts,
      toName: activeUser.vards || activeUser.epasts,
      text: text.trim(),
      ts: Date.now(),
      read: false,
    }
    const updated = [...getMessages(), msg]
    saveMessages(updated)
    setMessages(updated)
    setText("")
    textareaRef.current?.focus()
  }

  // Lejupielādē saraksti kā TXT
  const downloadSarakste = () => {
    if (!activeUser || !currentMsgs.length) return
    const lines = currentMsgs.map(m => {
      const who = m.from === myId ? myName : (activeUser.vards || activeUser.epasts)
      return `[${formatTime(m.ts)}] ${who}: ${m.text}`
    })
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sarakste_${(activeUser.vards || activeUser.epasts).replace(/\s/g,"_")}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Atpakaļ</button>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#a8d8a8" }}>✉️ Ziņojumi</h2>
      </div>

      <div style={s.container}>
        {/* Lietotāju saraksts */}
        <div style={s.sidebar}>
          <div style={s.sidebarHead}>Lietotāji ({displayUsers.length})</div>

          {displayUsers.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: "#557a55" }}>
              Nav reģistrētu lietotāju
            </div>
          )}

          {displayUsers.map(u => {
            const uid = u.id || u.epasts
            const unread = unreadFrom(uid)
            const active = activeUser && (activeUser.id || activeUser.epasts) === uid
            const lastMsg = [...messages]
              .filter(m => (m.from === myId && m.to === uid) || (m.to === myId && m.from === uid))
              .sort((a, b) => b.ts - a.ts)[0]

            return (
              <div
                key={uid}
                style={s.userItem(active, unread > 0)}
                onClick={() => { setActiveUser(u); setJauns(false) }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#1a2e1a" }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "none" }}
              >
                <div style={s.avatar(avatarColor(u.vards || u.epasts))}>
                  {iniciāļi(u.vards || u.epasts)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: unread > 0 ? 700 : 400, color: "#a8d8a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.vards || u.epasts}
                    </span>
                    {unread > 0 && (
                      <span style={{
                        background: "#e65100",
                        color: "white",
                        borderRadius: 10,
                        padding: "1px 6px",
                        fontSize: 10,
                        fontWeight: 700,
                        flexShrink: 0,
                        marginLeft: 4,
                      }}>{unread}</span>
                    )}
                  </div>
                  {lastMsg && (
                    <div style={{ fontSize: 11, color: "#557a55", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {lastMsg.from === myId ? "Es: " : ""}{lastMsg.text}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Čata logs */}
        <div style={s.chatArea}>
          {!activeUser ? (
            <div style={s.empty}>
              <div style={{ fontSize: 40 }}>✉️</div>
              <div style={{ fontSize: 14, color: "#557a55" }}>Izvēlies lietotāju no saraksta</div>
            </div>
          ) : (
            <>
              {/* Čata header */}
              <div style={s.chatHeader}>
                <div style={s.avatar(avatarColor(activeUser.vards || activeUser.epasts))}>
                  {iniciāļi(activeUser.vards || activeUser.epasts)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#a8d8a8" }}>
                    {activeUser.vards || activeUser.epasts}
                  </div>
                  <div style={{ fontSize: 11, color: "#557a55" }}>{activeUser.epasts}</div>
                </div>
                {currentMsgs.length > 0 && (
                  <button style={s.downloadBtn} onClick={downloadSarakste}>
                    ⬇ Lejupielādēt
                  </button>
                )}
              </div>

              {/* Ziņas */}
              <div style={s.messages}>
                {currentMsgs.length === 0 && (
                  <div style={{ textAlign: "center", color: "#557a55", fontSize: 13, marginTop: 40 }}>
                    Sāc sarunu — uzraksti pirmo ziņu!
                  </div>
                )}
                {currentMsgs.map(m => {
                  const isMine = m.from === myId
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                      <div style={s.msgBubble(isMine)}>{m.text}</div>
                      <div style={s.msgTime(isMine)}>
                        {formatTime(m.ts)}
                        {isMine && <span style={{ marginLeft: 4 }}>{m.read ? "✓✓" : "✓"}</span>}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef}/>
              </div>

              {/* Ievades lauks */}
              <div style={s.inputArea}>
                <textarea
                  ref={textareaRef}
                  style={s.textarea}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sutat()
                    }
                  }}
                  placeholder="Raksti ziņu... (Enter — sūtīt, Shift+Enter — jauna rinda)"
                  rows={1}
                />
                <button style={s.sendBtn} onClick={sutat}>➤</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
