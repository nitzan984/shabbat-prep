import { describe, expect, it } from 'vitest'
import { parseReadings, stripNiqqud } from './hebrew'
import { addDays, formatCountdown, israelDay } from './time'
import { resolveFriday, shabbatPhase } from './week'

const at = (iso: string) => Date.parse(iso)

describe('israelDay', () => {
  it('uses Israel time, not UTC', () => {
    // 23:30 UTC on Friday is already Saturday 01:30 in Israel
    expect(israelDay(at('2026-11-27T23:30:00Z'))).toEqual({ iso: '2026-11-28', weekday: 6 })
    expect(israelDay(at('2026-11-27T10:00:00+02:00'))).toEqual({ iso: '2026-11-27', weekday: 5 })
  })
})

describe('resolveFriday', () => {
  const havdalah = '2026-11-28T17:16:00+02:00'
  const friday = (now: string) => resolveFriday(at(now), israelDay(at(now)), havdalah)

  it('Sunday to Friday → the coming Friday', () => {
    expect(friday('2026-11-22T09:00:00+02:00').friday).toBe('2026-11-27')
    expect(friday('2026-11-26T09:00:00+02:00').friday).toBe('2026-11-27')
    expect(friday('2026-11-27T20:00:00+02:00').friday).toBe('2026-11-27')
  })
  it('Saturday before havdalah → yesterday', () => {
    expect(friday('2026-11-28T17:15:00+02:00')).toEqual({ friday: '2026-11-27', isMotzaeiShabbat: false })
  })
  it('Saturday after havdalah → next Friday', () => {
    expect(friday('2026-11-28T17:16:00+02:00')).toEqual({ friday: '2026-12-04', isMotzaeiShabbat: true })
  })
  it('Saturday with no data yet stays on yesterday', () => {
    const now = at('2026-11-28T20:00:00+02:00')
    expect(resolveFriday(now, israelDay(now), undefined).friday).toBe('2026-11-27')
  })
})

describe('shabbatPhase', () => {
  const candles = '2026-11-27T16:16:00+02:00'
  const havdalah = '2026-11-28T17:16:00+02:00'
  it('moves before → shabbat → after', () => {
    expect(shabbatPhase(at('2026-11-27T16:15:00+02:00'), candles, havdalah, false)).toBe('before')
    expect(shabbatPhase(at('2026-11-27T16:16:00+02:00'), candles, havdalah, false)).toBe('shabbat')
    expect(shabbatPhase(at('2026-11-28T18:00:00+02:00'), candles, havdalah, false)).toBe('after')
    expect(shabbatPhase(at('2026-11-28T18:00:00+02:00'), candles, havdalah, true)).toBe('after')
  })
})

describe('formatCountdown', () => {
  const MIN = 60_000
  it('formats each range', () => {
    expect(formatCountdown(3 * 60 * MIN + 12 * MIN)).toBe('עוד 3:12 שעות')
    expect(formatCountdown(8 * MIN + 41_000)).toBe('עוד 08:41 דקות')
    expect(formatCountdown(26 * 60 * MIN)).toBe('עוד יום ו־2 שעות')
    expect(formatCountdown(49 * 60 * MIN)).toBe('עוד יומיים ו־שעה')
    expect(formatCountdown(4 * 24 * 60 * MIN + 5 * 60 * MIN)).toBe('עוד 4 ימים ו־5 שעות')
  })
})

describe('addDays', () => {
  it('crosses months and years', () => {
    expect(addDays('2026-11-27', 7)).toBe('2026-12-04')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-11-27', -6)).toBe('2026-11-21')
  })
})

describe('hebrew', () => {
  it('strips niqqud but keeps geresh and gershayim', () => {
    expect(stripNiqqud('י״ח בְּכִסְלֵו תשפ״ז')).toBe('י״ח בכסלו תשפ״ז')
    expect(stripNiqqud('א׳')).toBe('א׳')
  })
  it('translates book names and drops English notes', () => {
    expect(parseReadings('Genesis 37:1-40:23; Numbers 7:1-17')).toEqual([
      { book: 'בראשית', ref: '37:1-40:23' },
      { book: 'במדבר', ref: '7:1-17' },
    ])
    expect(parseReadings('II Kings 11:17-12:17 | Shabbat Shekalim')).toEqual([
      { book: 'מלכים ב׳', ref: '11:17-12:17' },
    ])
    expect(parseReadings('Song of Songs 1:1-8:14')).toEqual([{ book: 'שיר השירים', ref: '1:1-8:14' }])
  })
})
