// OpenAI attēlu ģenerēšanas proxy
// Vercel env: OPENAI_KEY
// POST { model, prompt, n, size, quality?, output_format? }

export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_KEY
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_KEY nav iestatīts Vercel' })

  // GET — atgriež pieejamos modeļus diagnostikai
  if (req.method === 'GET') {
    const r = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const d = await r.json()
    const imageModels = (d.data || [])
      .map(m => m.id)
      .filter(id => /dall|image|gpt-image/i.test(id))
      .sort()
    return res.status(r.status).json({ all_image_models: imageModels, total_models: d.data?.length })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const upstream = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(req.body),
  })

  const data = await upstream.json()
  res.status(upstream.status).json(data)
}
