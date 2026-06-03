// ACM — Āfrikas Cūku Mēris 🐗 — Vercel production proxy
import { acmValidetToken } from '../src/utils/acm.js'

export default async function handler(req, res) {
  const token  = req.headers['x-acm-token']  || ''
  const sesija = req.headers['x-sesija-id']  || ''

  if (!acmValidetToken(token, sesija)) {
    console.warn('[ACM] 🐗 Bloķēts pieprasījums')
    return res.status(403).json({ error: 'ACM_BLOCKED' })
  }

  const url = new URL(req.url, `https://${req.headers.host}`)
  const anthropicPath = url.pathname.replace(/^\/api\/anthropic/, '') || '/v1/messages'

  const isStream = req.body?.stream === true

  const upstream = await fetch(`https://api.anthropic.com${anthropicPath}`, {
    method: req.method,
    headers: {
      'Content-Type':       'application/json',
      'x-api-key':          (process.env.ANTHROPIC_KEY || '').trim(),
      'anthropic-version':  '2023-06-01',
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
  })

  if (isStream && upstream.body) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.status(upstream.status)
    const reader = upstream.body.getReader()
    const write  = async () => {
      while (true) {
        const { done, value } = await reader.read()
        if (done) { res.end(); return }
        res.write(Buffer.from(value))
      }
    }
    return write()
  }

  const data = await upstream.json()
  res.status(upstream.status).json(data)
}
