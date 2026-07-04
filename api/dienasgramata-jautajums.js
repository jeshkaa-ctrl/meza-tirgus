// Mednieka Dienasgrāmata — AI statistikas jautājumi
// Vercel env: ANTHROPIC_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY
// POST { userId, jautajums }

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, jautajums } = req.body
  if (!userId || !jautajums) return res.status(400).json({ error: 'userId un jautajums required' })

  const { data: vesture } = await supabase
    .from('medibu_dienasgramata')
    .select('*')
    .eq('user_id', userId)
    .order('datums', { ascending: false })

  if (!vesture || !vesture.length) {
    return res.status(200).json({ atbilde: 'Dienasgrāmatā vēl nav ierakstu. Pievieno pirmo ierakstu un tad vari jautāt!' })
  }

  const sistemaPrompt = `Tu esi mednieka personīgais statistikas asistents Mednieka Rokasgrāmatā.
Analizē mednieka dienasgrāmatas datus un atbildi uz jautājumiem par viņa medību statistiku.
Esi konkrēts, sniedz skaitļus, atzīme tendences.
Atbildi latviešu valodā. Max 4-5 teikumi.`

  const atbilde = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': (process.env.ANTHROPIC_KEY || '').trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: sistemaPrompt,
      messages: [{
        role: 'user',
        content: `Mana medību dienasgrāmata (${vesture.length} ieraksti):\n${JSON.stringify(vesture, null, 2)}\n\nJautājums: ${jautajums}`,
      }],
    }),
  })

  const dati = await atbilde.json()
  const teksts = dati.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''

  res.status(200).json({ atbilde: teksts })
}
