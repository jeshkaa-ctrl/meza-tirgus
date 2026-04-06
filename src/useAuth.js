import { useState } from "react"

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mt_user")) || null }
    catch { return null }
  })

  const registreties = (dati) => {
    const u = { ...dati, id: Date.now(), datums: new Date().toISOString() }
    localStorage.setItem("mt_user", JSON.stringify(u))
    setUser(u)
  }

  const iziet = () => {
    localStorage.removeItem("mt_user")
    setUser(null)
  }

  return { user, registreties, iziet }
}