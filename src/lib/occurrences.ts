import type { CalendarEvent } from '../services/shared'
import type { PersonFilter } from './family'
import { addDays, daysBetween, type IsoDate } from './time'

/** מפגש אחד ביומן: אירוע חד־פעמי, או מופע של חוג שבועי. */
export interface Occurrence {
  event: CalendarEvent
  date: IsoDate
  /** מפגש של חוג שבוטל לתאריך הזה */
  skipped: boolean
}

/** כל המפגשים בטווח [from, to], ממוינים לפי תאריך ושעה. */
export function expandOccurrences(events: CalendarEvent[], from: IsoDate, to: IsoDate): Occurrence[] {
  const result: Occurrence[] = []
  for (const event of events) {
    if (event.repeat === 'none') {
      if (event.date >= from && event.date <= to) {
        result.push({ event, date: event.date, skipped: false })
      }
      continue
    }
    const last = event.repeatUntil && event.repeatUntil < to ? event.repeatUntil : to
    // המפגש הראשון שנופל בטווח: מדלגים בכפולות של שבוע מהמפגש הראשון של החוג
    const weeksToSkip = event.date >= from ? 0 : Math.ceil(daysBetween(event.date, from) / 7)
    for (let date = addDays(event.date, weeksToSkip * 7); date <= last; date = addDays(date, 7)) {
      result.push({ event, date, skipped: event.skipDates.includes(date) })
    }
  }
  return result.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.event.startTime ?? '').localeCompare(b.event.startTime ?? '') ||
      a.event.title.localeCompare(b.event.title, 'he'),
  )
}

/** סינון לפי אדם: אירועים שלו ואירועים של כל המשפחה */
export const forPerson = (occurrences: Occurrence[], filter: PersonFilter) =>
  filter === 'all' ? occurrences : occurrences.filter((o) => o.event.person === filter || o.event.person === null)

/** "16:00–17:30", "16:00", או null */
export function timeRange(event: CalendarEvent): string | null {
  if (!event.startTime) return null
  return event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime
}
