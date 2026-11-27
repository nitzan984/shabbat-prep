import { LOCATION } from '../config'
import type { IsoDate } from '../lib/time'
import { buildUrl, getJson } from './http'

// ---------- מבנה התגובה של Open-Meteo ----------

interface OpenMeteoResponse {
  current?: { time: string; temperature_2m: number; weather_code: number }
  daily: {
    time: IsoDate[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: (number | null)[]
  }
}

// ---------- מודל ----------

export interface DayForecast {
  date: IsoDate
  code: number
  max: number
  min: number
  /** סיכוי לגשם באחוזים */
  rainChance: number | null
}

export interface Forecast {
  current: { temperature: number; code: number } | null
  days: Record<IsoDate, DayForecast>
}

export async function fetchForecast(signal: AbortSignal): Promise<Forecast> {
  const url = buildUrl('https://api.open-meteo.com/v1/forecast', {
    latitude: LOCATION.latitude,
    longitude: LOCATION.longitude,
    current: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: LOCATION.tzid,
    forecast_days: 7,
  })
  const raw = await getJson<OpenMeteoResponse>(url, signal)
  const d = raw.daily
  const days: Record<IsoDate, DayForecast> = {}
  d.time.forEach((date, i) => {
    days[date] = {
      date,
      code: d.weather_code[i],
      max: d.temperature_2m_max[i],
      min: d.temperature_2m_min[i],
      rainChance: d.precipitation_probability_max[i] ?? null,
    }
  })
  return {
    current: raw.current
      ? { temperature: raw.current.temperature_2m, code: raw.current.weather_code }
      : null,
    days,
  }
}
