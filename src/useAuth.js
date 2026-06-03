import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"

export function useAuth() {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Pārbauda esošo sesiju; ja nav — mēģina admin auto-login
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) ielādētProfilu(session.user)
      else setLoading(false)
    })

    // Klausās izmaiņas (pieteikšanās, izrakstīšanās)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) ielādētProfilu(session.user)
      else { setUser(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function ielādētProfilu(authUser) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      setUser({
        id:            authUser.id,
        epasts:        authUser.email,
        vards:         profile?.vards         || "",
        uznemums:      profile?.uznemums      || "",
        darbiba:       profile?.darbiba       || "",
        talrunis:      profile?.talrunis      || "",
        bazesNovads:   profile?.bazesNovads   || "",
        papilduNovadi: profile?.papilduNovadi || [],
        tips:          profile?.tips          || "privatpersona",
      })
    } catch {
      setUser({ id: authUser.id, epasts: authUser.email, vards: "", uznemums: "", darbiba: "", talrunis: "", bazesNovads: "", papilduNovadi: [], tips: "privatpersona" })
    } finally {
      setLoading(false)
    }
  }

  // Reģistrācija — met kļūdu ja neveiksmīgi
  const registreties = async (dati) => {
    const { data, error } = await supabase.auth.signUp({
      email:    dati.epasts,
      password: dati.parole,
    })
    if (error) throw new Error(tulkotKludu(error.message))

    // Ja e-pasta apstiprināšana vajadzīga
    if (data.user && !data.session) {
      throw new Error("✉️ Pārbaudiet e-pastu un apstipriniet reģistrāciju!")
    }

    // Saglabā profila datus
    if (data.user) {
      await supabase.from("profiles").upsert({
        id:            data.user.id,
        vards:         dati.vards         || "",
        uznemums:      dati.uznemums      || "",
        darbiba:       dati.darbiba       || "",
        talrunis:      dati.talrunis      || "",
        bazesNovads:   dati.bazesNovads   || "",
        papilduNovadi: dati.papilduNovadi || [],
        tips:          dati.tips          || "privatpersona",
      })
    }
  }

  // Pieteikšanās — met kļūdu ja neveiksmīgi
  const pieteikties = async (dati) => {
    const { error } = await supabase.auth.signInWithPassword({
      email:    dati.epasts,
      password: dati.parole,
    })
    if (error) throw new Error("Nepareizs e-pasts vai parole!")
  }

  // Izrakstīšanās
  const iziet = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Paroles maiņa (pieslēgtam lietotājam)
  const mainitParoli = async (jaunāParole) => {
    const { error } = await supabase.auth.updateUser({ password: jaunāParole })
    if (error) throw new Error(tulkotKludu(error.message))
  }

  // Paroles atjaunošana — nosūta reset saiti uz e-pastu
  const nosutitParolesReset = async (epasts) => {
    const { error } = await supabase.auth.resetPasswordForEmail(epasts, {
      redirectTo: `${window.location.origin}/?reset=1`,
    })
    if (error) throw new Error(tulkotKludu(error.message))
  }

  // Profila atjaunošana
  const atjaunotProfilu = async (dati) => {
    if (!user) return
    const { error } = await supabase.from("profiles").update(dati).eq("id", user.id)
    if (error) throw new Error(error.message)
    setUser(prev => ({ ...prev, ...dati }))
  }

  return { user, loading, registreties, pieteikties, iziet, mainitParoli, nosutitParolesReset, atjaunotProfilu }
}

// Supabase kļūdu tulkošana latviski
function tulkotKludu(msg) {
  if (!msg) return "Kļūda"
  if (msg.includes("already registered") || msg.includes("already exists")) return "Šis e-pasts jau ir reģistrēts!"
  if (msg.includes("Invalid login"))      return "Nepareizs e-pasts vai parole!"
  if (msg.includes("Email not confirmed")) return "Apstipriniet e-pastu pirms pieteikšanās!"
  if (msg.includes("Password should be")) return "Parolei jābūt vismaz 6 simboli!"
  if (msg.includes("rate limit"))         return "Pārāk daudz mēģinājumu. Uzgaidiet!"
  if (msg.includes("network"))            return "Nav savienojuma. Pārbaudiet internetu!"
  return msg
}
