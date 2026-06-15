import Anthropic from '@anthropic-ai/sdk'
import { kv } from '@vercel/kv'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM = `You parse booking confirmation emails into travel itinerary entries.
Return ONLY a valid JSON array. Each element must match one of these shapes:

Travel entry (flights, trains, buses, ferries):
{ type:"travel", title:string, date:"YYYY-MM-DD", mode:"flight"|"train"|"bus"|"ferry"|"other",
  origin:string, destination:string, flightNumber?:string,
  startTime?:"HH:MM", endTime?:"HH:MM", cost?:number, currency?:string,
  confirmationNumber?:string, bookingUrl?:string, notes?:string }

Stay entry (hotels, hostels, Airbnb):
{ type:"stay", title:string, date:"YYYY-MM-DD",
  accommodationType:"hotel"|"hostel"|"airbnb"|"other",
  checkIn:"YYYY-MM-DD", checkOut:"YYYY-MM-DD",
  address?:string, cost?:number, currency?:string,
  confirmationNumber?:string, bookingUrl?:string, notes?:string }

Experience entry (tours, activities, restaurants):
{ type:"experience", title:string, date:"YYYY-MM-DD",
  location?:string, startTime?:"HH:MM", endTime?:"HH:MM",
  cost?:number, currency?:string, confirmationNumber?:string, notes?:string }

Place entry (attractions, landmarks):
{ type:"place", title:string, date:"YYYY-MM-DD",
  address?:string, startTime?:"HH:MM", notes?:string }

Rules:
- currency must be ISO 4217 (USD, GBP, EUR, JPY, etc.)
- Times must be 24-hour HH:MM format
- Dates must be YYYY-MM-DD
- Return [] if nothing useful found
- Return ONLY the JSON array, no explanation`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const body = req.body ?? {}
  const subject: string = body.Subject ?? ''
  const textBody: string = body.TextBody ?? body.StrippedTextReply ?? ''
  const htmlBody: string = body.HtmlBody ?? ''

  // Code must be in brackets: [AB12CD]
  const codeMatch = subject.match(/\[([A-Z0-9]{6})\]/i)
  if (!codeMatch) return res.status(200).json({ ok: true, skipped: 'no [CODE] in subject' })
  const code = codeMatch[1].toUpperCase()

  const emailContent = textBody
    || htmlBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
               .replace(/<[^>]+>/g, ' ')
               .replace(/\s+/g, ' ')
               .trim()

  if (!emailContent) return res.status(200).json({ ok: true, skipped: 'empty body' })

  const anthropic = new Anthropic()
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `Subject: ${subject}\n\n${emailContent.slice(0, 8000)}`,
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const jsonMatch = raw.match(/\[[\s\S]*\]/)
  let entries: unknown[] = []
  try {
    entries = jsonMatch ? JSON.parse(jsonMatch[0]) : []
  } catch {
    entries = []
  }

  if (entries.length > 0) {
    await kv.set(`import:${code}`, entries, { ex: 1800 })
  }

  return res.status(200).json({ ok: true, parsed: entries.length })
}
