import type { Entry, TravelEntry } from './types'

export interface Currency { code: string; symbol: string; name: string }

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',    name: 'US Dollar' },
  { code: 'EUR', symbol: '€',    name: 'Euro' },
  { code: 'GBP', symbol: '£',    name: 'British Pound' },
  { code: 'JPY', symbol: '¥',    name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥',    name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$',   name: 'Canadian Dollar' },
  { code: 'MXN', symbol: 'MX$',  name: 'Mexican Peso' },
  { code: 'INR', symbol: '₹',    name: 'Indian Rupee' },
  { code: 'KRW', symbol: '₩',    name: 'South Korean Won' },
  { code: 'THB', symbol: '฿',    name: 'Thai Baht' },
  { code: 'SGD', symbol: 'S$',   name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$',  name: 'Hong Kong Dollar' },
  { code: 'BRL', symbol: 'R$',   name: 'Brazilian Real' },
  { code: 'IDR', symbol: 'Rp',   name: 'Indonesian Rupiah' },
  { code: 'VND', symbol: '₫',    name: 'Vietnamese Dong' },
  { code: 'AED', symbol: 'AED',  name: 'UAE Dirham' },
  { code: 'TRY', symbol: '₺',    name: 'Turkish Lira' },
  { code: 'CHF', symbol: 'Fr',   name: 'Swiss Franc' },
  { code: 'NZD', symbol: 'NZ$',  name: 'New Zealand Dollar' },
  { code: 'MYR', symbol: 'RM',   name: 'Malaysian Ringgit' },
  { code: 'PHP', symbol: '₱',    name: 'Philippine Peso' },
  { code: 'ZAR', symbol: 'R',    name: 'South African Rand' },
  { code: 'SEK', symbol: 'kr',   name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr',   name: 'Norwegian Krone' },
]

// Lowercase keyword → currency code; matched against origin/destination text
const KEYWORD_MAP: Record<string, string> = {
  // Japan
  japan: 'JPY', tokyo: 'JPY', osaka: 'JPY', kyoto: 'JPY', hiroshima: 'JPY',
  nrt: 'JPY', hnd: 'JPY', kix: 'JPY', itm: 'JPY',
  // Mexico
  mexico: 'MXN', cancun: 'MXN', guadalajara: 'MXN', cun: 'MXN', mex: 'MXN',
  // Eurozone
  paris: 'EUR', berlin: 'EUR', rome: 'EUR', madrid: 'EUR', amsterdam: 'EUR',
  cdg: 'EUR', fra: 'EUR', ams: 'EUR', bcn: 'EUR', fco: 'EUR',
  // UK
  london: 'GBP', lhr: 'GBP', lgw: 'GBP', man: 'GBP',
  // Australia
  sydney: 'AUD', melbourne: 'AUD', brisbane: 'AUD', syd: 'AUD', mel: 'AUD',
  // Canada
  toronto: 'CAD', vancouver: 'CAD', yyz: 'CAD', yvr: 'CAD',
  // China
  beijing: 'CNY', shanghai: 'CNY', pek: 'CNY', pvg: 'CNY',
  // India
  india: 'INR', delhi: 'INR', mumbai: 'INR', del: 'INR', bom: 'INR',
  // Korea
  seoul: 'KRW', busan: 'KRW', icn: 'KRW',
  // Thailand
  thailand: 'THB', bangkok: 'THB', bkk: 'THB', dmk: 'THB',
  // Singapore
  singapore: 'SGD', sin: 'SGD',
  // Hong Kong
  'hong kong': 'HKD', hkg: 'HKD',
  // Vietnam
  vietnam: 'VND', hanoi: 'VND', 'ho chi minh': 'VND', han: 'VND', sgn: 'VND',
  // Indonesia / Bali
  bali: 'IDR', jakarta: 'IDR', dps: 'IDR', cgk: 'IDR',
  // UAE
  dubai: 'AED', 'abu dhabi': 'AED', dxb: 'AED',
  // Brazil
  brazil: 'BRL', rio: 'BRL', 'sao paulo': 'BRL', gru: 'BRL', gig: 'BRL',
  // Switzerland
  zurich: 'CHF', geneva: 'CHF', zrh: 'CHF',
  // Turkey
  istanbul: 'TRY', ist: 'TRY',
  // New Zealand
  'new zealand': 'NZD', auckland: 'NZD', akl: 'NZD',
  // Malaysia
  malaysia: 'MYR', 'kuala lumpur': 'MYR', kul: 'MYR',
  // Philippines
  manila: 'PHP', mla: 'PHP',
  // South Africa
  'cape town': 'ZAR', johannesburg: 'ZAR', cpt: 'ZAR', jnb: 'ZAR',
}

export function inferTripCurrencies(entries: Entry[]): string[] {
  const detected = new Set<string>()
  for (const e of entries) {
    if (e.type !== 'travel') continue
    const t = e as TravelEntry
    for (const text of [t.origin, t.destination]) {
      if (!text) continue
      const lower = text.toLowerCase()
      for (const [kw, code] of Object.entries(KEYWORD_MAP)) {
        if (lower.includes(kw)) detected.add(code)
      }
    }
  }
  const rest = CURRENCIES.map(c => c.code).filter(c => c !== 'USD' && !detected.has(c))
  return ['USD', ...[...detected].filter(c => c !== 'USD'), ...rest]
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code
}

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find(c => c.code === code)
}
