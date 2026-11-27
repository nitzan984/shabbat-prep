import { LOCATION } from '../config'
import { parseReadings, stripNiqqud, type Reading } from '../lib/hebrew'
import { addDays, isoParts, type IsoDate } from '../lib/time'
import { buildUrl, getJson } from './http'

// ---------- מבנה התגובות של Hebcal (נבדק מול תגובה אמיתית, נובמבר 2026) ----------

interface HebcalLeyning {
  torah?: string
  haftarah?: string
  /** קיים רק בשבועות שבהם ההפטרה של הספרדים שונה */
  haftarah_sephardic?: string
  maftir?: string
}

interface HebcalShabbatItem {
  title: string
  /** "2026-11-27T16:16:00+02:00" או "2026-11-28" */
  date: string
  category: 'candles' | 'parashat' | 'havdalah' | 'holiday' | 'mevarchim' | 'roshchodesh' | string
  subcat?: string
  hebrew: string
  leyning?: HebcalLeyning
}

interface HebcalShabbatResponse {
  items: HebcalShabbatItem[]
}

type ZmanKey =
  | 'alotHaShachar'
  | 'sunrise'
  | 'sofZmanShmaMGA16Point1'
  | 'sofZmanShma'
  | 'chatzot'
  | 'plagHaMincha'
  | 'sunset'
  | 'tzeit72min'

interface HebcalZmanimResponse {
  date: string
  times: Partial<Record<ZmanKey, string>>
}

interface HebcalConverterRangeResponse {
  hdates: Record<IsoDate, { hebrew: string }>
}

// ---------- מודל הנתונים של האפליקציה ----------

export interface DayZmanim {
  alotHaShachar: string | null
  sunrise: string | null
  /** סוף זמן ק״ש לפי מג״א, 16.1° (כשיטת הרב עובדיה יוסף) */
  sofZmanShmaMGA: string | null
  /** סוף זמן ק״ש לפי הגר״א */
  sofZmanShmaGRA: string | null
  chatzot: string | null
  plagHaMincha: string | null
  sunset: string | null
  /** 72 דקות אחרי השקיעה (רבנו תם) */
  tzeit72min: string | null
}

export interface ShabbatWeek {
  friday: IsoDate
  saturday: IsoDate
  /** זמן הדלקת נרות (20 דק׳ לפני השקיעה) */
  candleLighting: string | null
  /** צאת השבת, 8.5° */
  havdalah: string | null
  /** "פרשת וישלח", או שם החג כשאין פרשה */
  title: string | null
  torah: Reading[]
  /** ההפטרה לפי מנהג הספרדים כשהיא שונה */
  haftarah: Reading[]
  /** שבת שקלים, מברכים חודש, חנוכה וכו׳ */
  specialDays: string[]
  /** תאריך עברי (בלי ניקוד) לכל יום מהשבת הקודמת ועד השבת הזו */
  hebrewDates: Record<IsoDate, string>
  zmanim: { friday: DayZmanim; saturday: DayZmanim }
}

// ---------- גישה ל־API ----------

const COORDS = {
  latitude: LOCATION.latitude,
  longitude: LOCATION.longitude,
  tzid: LOCATION.tzid,
}

function fetchShabbat(friday: IsoDate, signal: AbortSignal) {
  const { year, month, day } = isoParts(friday)
  const url = buildUrl('https://www.hebcal.com/shabbat', {
    cfg: 'json',
    ...COORDS,
    b: 20, // הדלקת נרות 20 דקות לפני השקיעה (מנהג ספרדי)
    M: 'on', // הבדלה בצאת הכוכבים, 8.5°
    i: 'on', // לוח הקריאה של ארץ ישראל
    lg: 'he',
    leyning: 'on',
    gy: year,
    gm: month,
    gd: day,
  })
  return getJson<HebcalShabbatResponse>(url, signal)
}

function fetchZmanim(date: IsoDate, signal: AbortSignal) {
  const url = buildUrl('https://www.hebcal.com/zmanim', { cfg: 'json', ...COORDS, date })
  return getJson<HebcalZmanimResponse>(url, signal)
}

/** אותו converter, בטווח תאריכים: קריאה אחת לכל השבוע במקום קריאה לכל יום. */
function fetchHebrewDates(start: IsoDate, end: IsoDate, signal: AbortSignal) {
  const url = buildUrl('https://www.hebcal.com/converter', {
    cfg: 'json',
    start,
    end,
    g2h: 1,
    strict: 1,
  })
  return getJson<HebcalConverterRangeResponse>(url, signal)
}

// ---------- המרה למודל ----------

function toDayZmanim(response: HebcalZmanimResponse): DayZmanim {
  const t = response.times
  return {
    alotHaShachar: t.alotHaShachar ?? null,
    sunrise: t.sunrise ?? null,
    sofZmanShmaMGA: t.sofZmanShmaMGA16Point1 ?? null,
    sofZmanShmaGRA: t.sofZmanShma ?? null,
    chatzot: t.chatzot ?? null,
    plagHaMincha: t.plagHaMincha ?? null,
    sunset: t.sunset ?? null,
    tzeit72min: t.tzeit72min ?? null,
  }
}

const onDate = (item: HebcalShabbatItem, iso: IsoDate) => item.date.startsWith(iso)

function toShabbatWeek(
  friday: IsoDate,
  shabbat: HebcalShabbatResponse,
  fridayZmanim: HebcalZmanimResponse,
  saturdayZmanim: HebcalZmanimResponse,
  hebrewDates: HebcalConverterRangeResponse,
): ShabbatWeek {
  const saturday = addDays(friday, 1)
  const items = shabbat.items
  const candles =
    items.find((i) => i.category === 'candles' && onDate(i, friday)) ??
    items.find((i) => i.category === 'candles')
  const havdalah = items.find((i) => i.category === 'havdalah')

  // בשבת רגילה יש פריט parashat. בשבת חול המועד יש במקומו פריט חג עם קריאה.
  const reading =
    items.find((i) => i.category === 'parashat') ??
    items.find((i) => i.category === 'holiday' && onDate(i, saturday) && i.leyning?.torah)

  const specialDays = [
    ...new Set(
      items
        .filter(
          (i) =>
            i !== reading &&
            onDate(i, saturday) &&
            ['holiday', 'mevarchim', 'roshchodesh'].includes(i.category),
        )
        .map((i) => stripNiqqud(i.hebrew).split(':')[0].trim()),
    ),
  ]

  const leyning = reading?.leyning
  return {
    friday,
    saturday,
    candleLighting: candles?.date ?? null,
    havdalah: havdalah?.date ?? null,
    title: reading ? stripNiqqud(reading.hebrew) : null,
    torah: parseReadings(leyning?.torah),
    haftarah: parseReadings(leyning?.haftarah_sephardic ?? leyning?.haftarah),
    specialDays,
    hebrewDates: Object.fromEntries(
      Object.entries(hebrewDates.hdates).map(([iso, h]) => [iso, stripNiqqud(h.hebrew)]),
    ),
    zmanim: { friday: toDayZmanim(fridayZmanim), saturday: toDayZmanim(saturdayZmanim) },
  }
}

/** כל נתוני Hebcal של שבוע אחד, לפי תאריך יום שישי. */
export async function fetchShabbatWeek(friday: IsoDate, signal: AbortSignal): Promise<ShabbatWeek> {
  const saturday = addDays(friday, 1)
  const [shabbat, fridayZmanim, saturdayZmanim, hebrewDates] = await Promise.all([
    fetchShabbat(friday, signal),
    fetchZmanim(friday, signal),
    fetchZmanim(saturday, signal),
    // מהשבת הקודמת ועד השבת הזו: כל יום שבו "השבוע" הוא השבוע הזה
    fetchHebrewDates(addDays(friday, -6), saturday, signal),
  ])
  return toShabbatWeek(friday, shabbat, fridayZmanim, saturdayZmanim, hebrewDates)
}
