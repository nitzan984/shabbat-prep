import { defineQuery, useQuery } from '../lib/query'
import { addDays, israelDay, type IsoDate } from '../lib/time'
import { candidateFriday, resolveFriday } from '../lib/week'
import { fetchShabbatWeek, type ShabbatWeek } from '../services/hebcal'

/** נתוני Hebcal נשמרים לפי תאריך יום שישי ולא מתיישנים: נמשכים מחדש רק כשהשבוע מתחלף. */
const shabbatWeekQuery = defineQuery<IsoDate, ShabbatWeek>({
  name: 'hebcal-week',
  fetch: fetchShabbatWeek,
  staleTime: Infinity,
  persist: { keep: 3 },
})

export function useShabbatWeek(now: number) {
  const today = israelDay(now)
  // בשבת צריך את זמן ההבדלה של השבוע הנוכחי כדי לדעת אם כבר עברנו לשבוע הבא.
  // בשאר הימים זו אותה שאילתה בדיוק כמו query למטה.
  const candidateQuery = useQuery(shabbatWeekQuery, candidateFriday(today))
  const { friday, isMotzaeiShabbat } = resolveFriday(now, today, candidateQuery.data?.havdalah)
  const query = useQuery(shabbatWeekQuery, friday)

  return {
    today: today.iso,
    friday,
    saturday: addDays(friday, 1),
    /** מוצאי שבת: השבוע כבר התחלף, אבל עדיין אומרים "שבוע טוב" */
    isMotzaeiShabbat,
    query,
  }
}

export type ShabbatWeekView = ReturnType<typeof useShabbatWeek>
