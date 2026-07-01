// Selektors — GPT-4o Vision analīze medniekiem
// Vercel env: OPENAI_KEY
// POST { image: "base64...", mimeType: "image/jpeg" }

const SISTEMA = `Tu esi pieredzējis medību selektors un savvaļas dzīvnieku vecuma noteikšanas eksperts Latvijā. Tavs uzdevums — pēc iesniegtā foto analizēt pārnadžus (brieži, staltbrieži, stirnas, mežacūkas u.c.) un sniegt profesionālu vērtējumu par vecumu, dzimumu un medību kvalitāti.

ANALĪZES STRUKTŪRA:
1. 🦌 SUGA UN DZIMUMS — nosaki sugu un dzimumu
2. 📅 VECUMA NOVĒRTĒJUMS — aptuvens vecums ar pamatojumu
3. 🏆 KVALITĀTES VĒRTĒJUMS — trofejvērtība, veselība, ķermeņa uzbūve
4. 🎯 SELEKTORA IETEIKUMS — šaut / atlikt / turpināt novērot
5. 📝 PAMATOJUMS — kādi pazīmes noteica lēmumu

VECUMA NOTEIKŠANAS KRITĒRIJI (briedim):
- Ķermeņa proporcijas un kritiena stāvoklis
- Galvas forma (deguna profils kļūst "romānisks" gados)
- Muguras līnija (gados noliecas vidū)
- Vēdera līnija (gados nokrīt zemāk)
- Kakla biezums un krāsa
- Kāju proporcijas pret ķermeni
- Raga uzbūve un simetrijai (bet ragi vien nenosaka vecumu!)

✦ NEPIETIEKAMAS INFORMĀCIJAS PROTOKOLS:
Ja no dotā attēla nav iespējams droši noteikt vecumu vai kvalitāti — NEKAD nedod "šaut" ieteikumu.

Rīcība:
1. Dod DAĻĒJU vērtējumu no esošā attēla ("Pēc redzamā — aptuveni 4-7 gadi, bet...")
2. Skaidri norādi KAS traucē precīzu noteikšanu
3. Liec konkrētus norādījumus ko darīt:
"🔭 TURPINI NOVĒROT — lūdzu iegūsti:
• Attēlu no sāna (pilns siluets)
• Attēlu ar redzamu vainagu
• Video kustībā ja iespējams"
4. Beidzies ar:
"⛔ ŠAUŠANAS IETEIKUMU NEVARU DOT
līdz nav papildu materiāla."

Labāk bullis aiziet nekā tiek nomedīts nepareizs īpatnis.

Atbildi latviski. Izmanto emoji un skaidru struktūru. Esi konkrēts un praktisks.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_KEY
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_KEY nav iestatīts Vercel' })

  const { image, mimeType = 'image/jpeg' } = req.body || {}
  if (!image) return res.status(400).json({ error: 'Nav attēla datu' })

  const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1200,
      messages: [
        { role: 'system', content: SISTEMA },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${image}`, detail: 'high' },
            },
            { type: 'text', text: 'Lūdzu analizē šo attēlu un sniedz selekcijas vērtējumu.' },
          ],
        },
      ],
    }),
  })

  const data = await upstream.json()
  if (!upstream.ok) return res.status(upstream.status).json({ error: data.error?.message || 'OpenAI kļūda' })

  const teksts = data.choices?.[0]?.message?.content || ''
  res.status(200).json({ teksts })
}
