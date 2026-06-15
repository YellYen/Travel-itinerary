import { kv } from '@vercel/kv'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = String(req.query.code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!code || code.length !== 6) return res.status(400).json({ error: 'invalid code' })

  // getdel: retrieve and delete atomically so entries are only returned once
  const entries = await kv.getdel(`import:${code}`)
  return res.status(200).json({ entries: entries ?? null })
}
