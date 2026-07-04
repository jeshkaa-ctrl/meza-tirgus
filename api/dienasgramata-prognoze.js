// Mednieka Dienasgrāmata — AI rīta prognoze
// Vercel env: ANTHROPIC_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
// POST { userId, menessFaze, vejs, temperatura, nokrisni }

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, menessFaze, vejs, temperatura, nokrisni } = req.body
  if (!userId) return res.status(400).json({ error: 'userId required' })

  const { data: vesture } = await supabase
    .from('medibu_dienasgramata')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  const statistika = apreklinatStatistiku(vesture || [])

  const sistemaPrompt = `Tu esi mednieka personīgais AI asistents Mednieka Rokasgrāmatā.
Analizē mednieka vēsturiskos datus un sniedz personalizētu dienas prognozi.
Esi draudzīgs, īss, praktisks. Atbildi latviešu valodā. Max 3-4 teikumi.
Ja nav pietiekami datu, saki to godīgi un iedod vispārīgu padomu.`

  const lietotajsZinojums = `Šodienas apstākļi:
- Mēness fāze: ${menessFaze || 'nezināma'}
- Vējš: ${vejs || 'nezināms'}
- Temperatūra: ${temperatura != null ? temperatura + '°C' : 'nezināma'}
- Nokrišņi: ${nokrisni || 'nezināmi'}

Mana medību statistika:
${JSON.stringify(statistika, null, 2)}

Sagatavo īsu personalizētu dienas prognozi — vai šodien ir labas medību iespējas, balstoties uz maniem datiem un šodienas apstākļiem?`

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

  const nomediti = ieraksti.filter(i => i.nomedits)

  const sugas = {}
  nomediti.forEach(i => {
    if (i.suga) sugas[i.suga] = (sugas[i.suga] || 0) + 1
  })

  const stundas = {}
  nomediti.forEach(i => {
    if (i.laiks) {
      const h = i.laiks.split(':')[0]
      stundas[h + ':00'] = (stundas[h + ':00'] || 0) + 1
    }
  })

  const fazes = {}
  nomediti.forEach(i => {
    if (i.meness_faze) fazes[i.meness_faze] = (fazes[i.meness_faze] || 0) + 1
  })

  const veji = {}
  nomediti.forEach(i => {
    if (i.vejs) veji[i.vejs] = (veji[i.vejs] || 0) + 1
  })

  const labakastunda = Object.entries(stundas).sort((a, b) => b[1] - a[1])[0]
  const labakafaze = Object.entries(fazes).sort((a, b) => b[1] - a[1])[0]
  const labakakvejs = Object.entries(veji).sort((a, b) => b[1] - a[1])[0]

  return {
    kopejaisIerakstu: ieraksti.length,
    kopejaisNomedits: nomediti.length,
    sugas,
    labakastunda: labakastunda ? `${labakastunda[0]} (${labakastunda[1]}×)` : null,
    labakaMenessFaze: labakafaze ? `${labakafaze[0]} (${labakafaze[1]}×)` : null,
    labakaisVejs: labakakvejs ? `${labakakvejs[0]} (${labakakvejs[1]}×)` : null,
    pedejaisIeraksts: ieraksti[0]?.created_at,
  }
}
