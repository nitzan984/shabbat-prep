export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

interface WeatherInfo {
  label: string
  kind: WeatherKind
}

/** קודי WMO של Open-Meteo → תיאור בעברית וסוג אייקון. */
const CODES: Record<number, WeatherInfo> = {
  0: { label: 'בהיר', kind: 'clear' },
  1: { label: 'בהיר ברובו', kind: 'clear' },
  2: { label: 'מעונן חלקית', kind: 'partly' },
  3: { label: 'מעונן', kind: 'cloudy' },
  45: { label: 'ערפל', kind: 'fog' },
  48: { label: 'ערפל קפוא', kind: 'fog' },
  51: { label: 'טפטוף קל', kind: 'drizzle' },
  53: { label: 'טפטוף', kind: 'drizzle' },
  55: { label: 'טפטוף חזק', kind: 'drizzle' },
  56: { label: 'טפטוף קפוא', kind: 'drizzle' },
  57: { label: 'טפטוף קפוא חזק', kind: 'drizzle' },
  61: { label: 'גשם קל', kind: 'rain' },
  63: { label: 'גשם', kind: 'rain' },
  65: { label: 'גשם חזק', kind: 'rain' },
  66: { label: 'גשם קפוא', kind: 'rain' },
  67: { label: 'גשם קפוא חזק', kind: 'rain' },
  71: { label: 'שלג קל', kind: 'snow' },
  73: { label: 'שלג', kind: 'snow' },
  75: { label: 'שלג כבד', kind: 'snow' },
  77: { label: 'פתיתי שלג', kind: 'snow' },
  80: { label: 'ממטרים קלים', kind: 'rain' },
  81: { label: 'ממטרים', kind: 'rain' },
  82: { label: 'ממטרים עזים', kind: 'rain' },
  85: { label: 'ממטרי שלג', kind: 'snow' },
  86: { label: 'ממטרי שלג כבדים', kind: 'snow' },
  95: { label: 'סופת רעמים', kind: 'storm' },
  96: { label: 'סופת רעמים וברד', kind: 'storm' },
  99: { label: 'סופת רעמים וברד כבד', kind: 'storm' },
}

export const describeWeather = (code: number): WeatherInfo =>
  CODES[code] ?? { label: 'לא ידוע', kind: 'cloudy' }
