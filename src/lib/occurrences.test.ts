import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../services/shared'
import { expandOccurrences, forPerson } from './occurrences'
import { weekStartOf, weekdayOf } from './time'

const base: CalendarEvent = {
  id: 'x',
  title: 'חוג',
  person: 'shir',
  kind: 'class',
  date: '2026-11-03', // יום שלישי
  startTime: '16:00',
  endTime: '17:00',
  repeat: 'weekly',
  repeatUntil: null,
  skipDates: [],
  notes: null,
}

const dates = (events: CalendarEvent[], from: string, to: string) =>
  expandOccurrences(events, from, to).map((o) => `${o.date}${o.skipped ? ' (בוטל)' : ''}`)

describe('expandOccurrences', () => {
  it('repeats a weekly class on the same weekday inside the range', () => {
    expect(dates([base], '2026-11-22', '2026-12-21')).toEqual([
      '2026-11-24',
      '2026-12-01',
      '2026-12-08',
      '2026-12-15',
    ])
  })

  it('stops at repeatUntil and marks skipped dates', () => {
    const event = { ...base, repeatUntil: '2026-12-08', skipDates: ['2026-12-01'] }
    expect(dates([event], '2026-11-22', '2026-12-31')).toEqual(['2026-11-24', '2026-12-01 (בוטל)', '2026-12-08'])
  })

  it('does not start before the first meeting', () => {
    const event = { ...base, date: '2026-12-08' }
    expect(dates([event], '2026-11-22', '2026-12-21')).toEqual(['2026-12-08', '2026-12-15'])
  })

  it('includes one-off events only on their date, sorted by time', () => {
    const events: CalendarEvent[] = [
      { ...base, id: 'a', kind: 'event', repeat: 'none', date: '2026-11-24', startTime: '18:00', title: 'יום הולדת' },
      { ...base, id: 'b', date: '2026-11-24', startTime: '09:00' },
      { ...base, id: 'c', kind: 'event', repeat: 'none', date: '2026-10-01', title: 'ישן' },
    ]
    expect(expandOccurrences(events, '2026-11-24', '2026-11-24').map((o) => o.event.id)).toEqual(['b', 'a'])
  })

  it('filters by person, keeping family events', () => {
    const events: CalendarEvent[] = [
      { ...base, id: 'shir' },
      { ...base, id: 'eitan', person: 'eitan' },
      { ...base, id: 'family', person: null },
    ]
    const occ = expandOccurrences(events, '2026-11-24', '2026-11-24')
    expect(forPerson(occ, 'shir').map((o) => o.event.id).sort()).toEqual(['family', 'shir'])
    expect(forPerson(occ, 'all')).toHaveLength(3)
  })
})

describe('week helpers', () => {
  it('finds Sunday of the week', () => {
    expect(weekdayOf('2026-11-27')).toBe(5)
    expect(weekStartOf('2026-11-27')).toBe('2026-11-22')
    expect(weekStartOf('2026-11-22')).toBe('2026-11-22')
  })
})
