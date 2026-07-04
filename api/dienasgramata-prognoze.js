// Mednieka Dienasgrāmata — AI rīta prognoze
// Vercel env: ANTHROPIC_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
// POST { userId, menessFaze, aktivitate }

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, menessFaze, aktivitate = 'medibas' } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const { data: vesture } = await supabase
    .from('medibu_dienasgramata')
    .select('*')
    .eq('user_id', userId)
    .eq('aktivitate', aktivitate)
    .order('created_at', { ascending: false })
    .limit(150)

  const statistika = apreklinatStatistiku(vesture || [])

  const aktivitateNos = aktivitate === 'makskere' ? 'makšķerēšana' : 'medības'

  const sistemaPrompt = `Tu esi pieredzējuša mednieka un makšķernieka personīgais AI asistents Mednieka Rokasgrāmatā.
Analizē lietotāja vēsturiskos datus un sniedz personalizētu dienas prognozi par ${aktivitateNos}.
Esi draudzīgs, konkrēts, praktisks. Atbildi latviešu valodā. Max 3-4 teikumi.
Ja nav pietiekami datu, saki to godīgi un iedod vispārīgu padomu par šodienas apstākļiem.
Obligāti piemin laika apstākļu ietekmi ja ir dati par to.`

  const lietotajsZinojums = `Šodienas apstākļi:
- Mēness fāze: ${menessFaze || 'nezināma'}

Mana ${aktivitateNos} statistika (${statistika.kopejaisIerakstu} ieraksti, ${statistika.kopejaisNomedits} veiksmīgi):
${JSON.stringify(statistika, null, 2)}

Sagatavo īsu personalizētu prognozi — vai šodien ir labas ${aktivitateNos} iespējas balstoties uz maniem vēsturiskajiem datiem?`

  const atbilde = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': (process.env.ANTHROPIC_KEY || '').trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: sistemaPrompt,
      messages: [{ role: 'user', content: lietotajsZinojums }],
    }),
  })

  const dati = await atbilde.json()
  const teksts = dati.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''

  res.status(200).json({ prognoze: teksts })
}

function apreklinatStatistiku(ieraksti) {
  if (!ieraksti.length) return { zinotajs: 'Nav ierakstu vēl' }

  const veiksmigi = ieraksti.filter(i => i.nomedits)

  // Sugas
  const sugas = {}
  veiksmigi.forEach(i => {
    if (i.suga) sugas[i.suga] = (sugas[i.suga] || 0) + 1
  })

  // Labākās stundas
  const stundas = {}
  veiksmigi.forEach(i => {
    if (i.laiks) {
      const h = i.laiks.split(':')[0] + ':00'
      stundas[h] = (stundas[h] || 0) + 1
    }
  })

  // Mēness fāzes
  const fazes = {}
  veiksmigi.forEach(i => {
    if (i.meness_faze) fazes[i.meness_faze] = (fazes[i.meness_faze] || 0) + 1
  })

  // Vējš
  const veji = {}
  veiksmigi.forEach(i => {
    if (i.vejs) veji[i.vejs] = (veji[i.vejs] || 0) + 1
  })

  // Nokrišņi
  const nokrisni = {}
  veiksmigi.forEach(i => {
    if (i.nokrisni) nokrisni[i.nokrisni] = (nokrisni[i.nokrisni] || 0) + 1
  })

  // Temperatūra — grupē pa diapazoniem
  const tempDiapazoni = { 'zem 0°C': 0, '0–10°C': 0, '10–20°C': 0, 'virs 20°C': 0 }
  veiksmigi.forEach(i => {
    if (i.temperatura != null) {
      if (i.temperatura < 0) tempDiapazoni['zem 0°C']++
      else if (i.temperatura < 10) tempDiapazoni['0–10°C']++
      else if (i.temperatura < 20) tempDiapazoni['10–20°C']++
      else tempDiapazoni['virs 20°C']++
    }
  })
  // Noņem tukšos
  Object.keys(tempDiapazoni).forEach(k => {
    if (tempDiapazoni[k] === 0) delete tempDiapazoni[k]
  })

  const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1])[0]

  return {
    kopejaisIerakstu: ieraksti.length,
    kopejaisNomedits: veiksmigi.length,
    sugas,
    labakaMenessFaze: top(fazes) ? `${top(fazes)[0]} (${top(fazes)[1]}×)` : null,
    labakastunda: top(stundas) ? `${top(stundas)[0]} (${top(stundas)[1]}×)` : null,
    labakaisVejs: top(veji) ? `${top(veji)[0]} (${top(veji)[1]}×)` : null,
    labakaisLaiks: top(nokrisni) ? `${top(nokrisni)[0]} (${top(nokrisni)[1]}×)` : null,
    labakaisTempDiapazons: top(tempDiapazoni) ? `${top(tempDiapazoni)[0]} (${top(tempDiapazoni)[1]}×)` : null,
    pedejaisIeraksts: ieraksti[0]?.created_at,
  }
}
