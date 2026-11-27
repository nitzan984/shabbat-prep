import { LOCATION } from '../config'

/** תאריך אזרחי בפורמט YYYY-MM-DD. */
export type IsoDate = string

const TZ = LOCATION.tzid
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
})

/** התאריך והיום בשבוע לפי שעון ישראל, בלי קשר לאזור הזמן של המכשיר. */
export function israelDay(now: number): { iso: IsoDate; weekday: number } {
  const parts = partsFormatter.formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return {
    iso: `${get('year')}-${get('month')}-${get('day')}`,
    weekday: WEEKDAYS.indexOf(get('weekday')),
  }
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

export function isoParts(iso: IsoDate): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

const timeFormatter = new Intl.DateTimeFormat('he-IL', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "16:16" משעה בפורמט ISO (עם אזור זמן). */
export function formatTime(isoDateTime: string | null | undefined): string {
  if (!isoDateTime) return '—'
  const ms = Date.parse(isoDateTime)
  return Number.isNaN(ms) ? '—' : timeFormatter.format(ms)
}

const longDateFormatter = new Intl.DateTimeFormat('he-IL', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const weekdayFormatter = new Intl.DateTimeFormat('he-IL', { timeZone: 'UTC', weekday: 'long' })

const utcNoon = (iso: IsoDate) => {
  const { year, month, day } = isoParts(iso)
  return Date.UTC(year, month - 1, day, 12)
}

/** "יום שישי, 27 בנובמבר 2026" */
export const formatGregorianLong = (iso: IsoDate) => longDateFormatter.format(utcNoon(iso))

/** "יום שישי" */
export const formatWeekday = (iso: IsoDate) => weekdayFormatter.format(utcNoon(iso))

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const pad = (n: number) => String(n).padStart(2, '0')

/** טקסט הספירה לאחור: "עוד 3:12 שעות", "עוד יומיים ו־4 שעות", "עוד 08:41 דקות". */
export function formatCountdown(ms: number): string {
  const safe = Math.max(0, ms)
  if (safe >= 2 * DAY) {
    const days = Math.floor(safe / DAY)
    const hours = Math.floor((safe % DAY) / HOUR)
    const dayText = days === 2 ? 'יומיים' : `${days} ימים`
    return hours > 0 ? `עוד ${dayText} ו־${hours === 1 ? 'שעה' : `${hours} שעות`}` : `עוד ${dayText}`
  }
  if (safe >= DAY) {
    const hours = Math.floor((safe - DAY) / HOUR)
    return hours > 0 ? `עוד יום ו־${hours === 1 ? 'שעה' : `${hours} שעות`}` : 'עוד יום'
  }
  if (safe >= HOUR) {
    const hours = Math.floor(safe / HOUR)
    const minutes = Math.floor((safe % HOUR) / MINUTE)
    return `עוד ${hours}:${pad(minutes)} שעות`
  }
  const minutes = Math.floor(safe / MINUTE)
  const seconds = Math.floor((safe % MINUTE) / 1000)
  return `עוד ${pad(minutes)}:${pad(seconds)} דקות`
}

/** "1:05:09" או "04:30" לתצוגת הטיימר. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** "45 דק׳", "שעה", "שעה וחצי", "2 שעות ו־10 דק׳" */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} דק׳`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const hours = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`
  if (m === 0) return hours
  if (m === 30) return `${hours} וחצי`
  return `${hours} ו־${m} דק׳`
}

/** 0 = ראשון ... 6 = שבת, לתאריך אזרחי */
export function weekdayOf(iso: IsoDate): number {
  const { year, month, day } = isoParts(iso)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/** יום ראשון של השבוע שבו התאריך נמצא */
export const weekStartOf = (iso: IsoDate): IsoDate => addDays(iso, -weekdayOf(iso))

/** מספר הימים מ־a עד b */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  const pa = isoParts(a)
  const pb = isoParts(b)
  return Math.round((Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day)) / 86_400_000)
}

const dayMonthFormatter = new Intl.DateTimeFormat('he-IL', { timeZone: 'UTC', day: 'numeric', month: 'long' })

/** "22 בנובמבר" */
export const formatDayMonth = (iso: IsoDate) => dayMonthFormatter.format(utcNoon(iso))

/** "22.11" */
export const formatShortDate = (iso: IsoDate) => {
  const { month, day } = isoParts(iso)
  return `${day}.${month}`
}

export const HEBREW_DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
