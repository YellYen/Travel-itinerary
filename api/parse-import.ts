{\rtf1\ansi\ansicpg1252\cocoartf2870
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import Anthropic from '@anthropic-ai/sdk'\
import type \{ VercelRequest, VercelResponse \} from '@vercel/node'\
\
const SYSTEM = `You parse travel booking confirmations into structured itinerary entries.\
Return ONLY a valid JSON array. Each element must match one of these shapes:\
\
Travel (flights, trains, buses, ferries):\
\{ type:"travel", title:string, date:"YYYY-MM-DD", mode:"flight"|"train"|"bus"|"ferry"|"other",\
  origin:string, destination:string, flightNumber?:string,\
  startTime?:"HH:MM", endTime?:"HH:MM", cost?:number, currency?:string,\
  confirmationNumber?:string, bookingUrl?:string, notes?:string \}\
\
Stay (hotels, hostels, Airbnb):\
\{ type:"stay", title:string, date:"YYYY-MM-DD",\
  accommodationType:"hotel"|"hostel"|"airbnb"|"other",\
  checkIn:"YYYY-MM-DD", checkOut:"YYYY-MM-DD",\
  address?:string, cost?:number, currency?:string,\
  confirmationNumber?:string, bookingUrl?:string, notes?:string \}\
\
Experience (tours, activities, restaurants):\
\{ type:"experience", title:string, date:"YYYY-MM-DD",\
  location?:string, startTime?:"HH:MM", endTime?:"HH:MM",\
  cost?:number, currency?:string, confirmationNumber?:string, notes?:string \}\
\
Place (attractions, landmarks):\
\{ type:"place", title:string, date:"YYYY-MM-DD", address?:string, startTime?:"HH:MM" \}\
\
Rules:\
- currency must be ISO 4217 (USD, GBP, EUR, JPY, etc.)\
- Times in 24-hour HH:MM format\
- Dates in YYYY-MM-DD format\
- Return [] if nothing useful found\
- Return ONLY the JSON array, no explanation text`\
\
export default async function handler(req: VercelRequest, res: VercelResponse) \{\
  if (req.method !== 'POST') return res.status(405).end()\
\
  const text = String(req.body?.text ?? '').trim().slice(0, 10000)\
  if (!text) return res.status(400).json(\{ error: 'no text provided' \})\
\
  const anthropic = new Anthropic()\
  const message = await anthropic.messages.create(\{\
    model: 'claude-haiku-4-5-20251001',\
    max_tokens: 2048,\
    system: SYSTEM,\
    messages: [\{ role: 'user', content: text \}],\
  \})\
\
  const raw = message.content[0].type === 'text' ? message.content[0].text : '[]'\
  const jsonMatch = raw.match(/\\[[\\s\\S]*\\]/)\
  let entries: unknown[] = []\
  try \{ entries = jsonMatch ? JSON.parse(jsonMatch[0]) : [] \} catch \{ entries = [] \}\
\
  return res.status(200).json(\{ entries \})\
\}}