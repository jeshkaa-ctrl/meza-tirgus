// OpenAI attēlu ģenerēšanas proxy
// Vercel env: OPENAI_KEY
// POST { model, prompt, n, size, quality?, output_format? }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.OPENAI_KEY
  if (!apiKey) return res.status(500).json({ error: 'OPENAI_KEY nav iestatīts Vercel' })

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
