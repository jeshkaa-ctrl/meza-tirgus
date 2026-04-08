import { useState } from "react"

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mt_user")) || null }
    catch { return null }
  })

  const registreties = (dati) => {
    const u = { ...dati, id: Date.now(), datums: new Date().toISOString() }
    localStorage.setItem("mt_user", JSON.stringify(u))
    // Saglabā arī lietotāju sarakstā
    const visi = JSON.parse(localStorage.getItem("mt_lietotaji") || "[]")
    visi.push(u)
    localStorage.setItem("mt_lietotaji", JSON.stringify(visi))
    setUser(u)
  }

  const pieteikties = (dati, onKluda) => {
    const visi = JSON.parse(localStorage.getItem("mt_lietotaji") || "[]")
    const atrastais = visi.find(u => u.epasts === dati.epasts && u.parole === dati.parole)
    if (atrastais) {
      localStorage.setItem("mt_user", JSON.stringify(atrastais))
      setUser(atrastais)
    } else {
      onKluda?.("Nepareizs e-pasts vai parole!")
    }
  }

  const iziet = () => {
    localStorage.removeItem("mt_user")
    setUser(null)
  }

  return { user, registreties, pieteikties, iziet }
}