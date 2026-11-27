/**
 * בדיקה מול ה־API האמיתי (רשת). מורצת רק עם `pnpm test:live`.
 * ערכים צפויים לשבת פרשת וישלח, 28.11.2026, רחובות.
 */
import { describe, expect, it } from 'vitest'
import { formatTime } from '../lib/time'
import { fetchShabbatWeek } from './hebcal'
import { fetchForecast } from './weather'

const live = process.env.LIVE ? describe : describe.skip

live('Hebcal, Shabbat Vayishlach 5787', () => {
  it('returns the expected parasha, times and Hebrew dates', async () => {
    const week = await fetchShabbatWeek('2026-11-27', AbortSignal.timeout(20_000))
    const z = week.zmanim

    console.table({
      'פרשה': week.title,
      'הדלקת נרות': formatTime(week.candleLighting),
      'צאת השבת': formatTime(week.havdalah),
      'שקיעה בשבת': formatTime(z.saturday.sunset),
      'ר״ת': formatTime(z.saturday.tzeit72min),
      'עלות השחר': formatTime(z.saturday.alotHaShachar),
      'ק״ש מג״א': formatTime(z.saturday.sofZmanShmaMGA),
      'ק״ש גר״א': formatTime(z.saturday.sofZmanShmaGRA),
      'תורה': week.torah.map((r) => `${r.book} ${r.ref}`).join('; '),
      'הפטרה': week.haftarah.map((r) => `${r.book} ${r.ref}`).join('; '),
      'שבת (עברי)': week.hebrewDates[week.saturday],
    })

    expect(week.title).toBe('פרשת וישלח')
    expect(formatTime(week.candleLighting)).toBe('16:16')
    expect(formatTime(week.havdalah)).toBe('17:16')
    expect(formatTime(z.saturday.sunset)).toBe('16:37')
    expect(formatTime(z.saturday.tzeit72min)).toBe('17:49')
    expect(formatTime(z.saturday.sofZmanShmaMGA)).toBe('08:16')
    expect(formatTime(z.saturday.sofZmanShmaGRA)).toBe('08:54')
    expect(week.torah).toEqual([{ book: 'בראשית', ref: '32:4-36:43' }])
    expect(week.haftarah).toEqual([{ book: 'עובדיה', ref: '1:1-21' }])
    expect(week.hebrewDates['2026-11-28']).toBe('י״ח בכסלו תשפ״ז')
    expect(week.hebrewDates['2026-11-27']).toBe('י״ז בכסלו תשפ״ז')
    expect(Object.keys(week.hebrewDates)).toHaveLength(8)
  })

  it('uses the Sephardic haftarah when it differs (Vayetzei)', async () => {
    const week = await fetchShabbatWeek('2026-11-20', AbortSignal.timeout(20_000))
    expect(week.haftarah).toEqual([{ book: 'הושע', ref: '11:7-12:12' }])
  })

  it('falls back to the holiday reading on Shabbat Chol HaMoed', async () => {
    const week = await fetchShabbatWeek('2027-04-23', AbortSignal.timeout(20_000))
    expect(week.title).toContain('פסח')
    expect(week.torah[0]).toEqual({ book: 'שמות', ref: '33:12-34:26' })
  })
})

live('Open-Meteo', () => {
  it('returns 7 days with Hebrew-mappable codes', async () => {
    const forecast = await fetchForecast(AbortSignal.timeout(20_000))
    expect(Object.keys(forecast.days)).toHaveLength(7)
    expect(forecast.current?.temperature).toBeTypeOf('number')
  })
})
