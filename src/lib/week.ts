import { addDays, type IsoDate } from './time'

/**
 * יום שישי "מועמד" לפי היום בלבד: ראשון–שישי → השישי הקרוב (או היום),
 * שבת → השישי של אתמול. ההחלטה הסופית בשבת תלויה בזמן ההבדלה.
 */
export function candidateFriday(today: { iso: IsoDate; weekday: number }): IsoDate {
  return today.weekday === 6 ? addDays(today.iso, -1) : addDays(today.iso, 5 - today.weekday)
}

/** אחרי צאת השבת (במוצאי שבת) עוברים לשישי הבא. */
export function resolveFriday(
  now: number,
  today: { iso: IsoDate; weekday: number },
  candidateHavdalah: string | null | undefined,
): { friday: IsoDate; isMotzaeiShabbat: boolean } {
  const candidate = candidateFriday(today)
  const isMotzaeiShabbat =
    today.weekday === 6 && !!candidateHavdalah && now >= Date.parse(candidateHavdalah)
  return { friday: isMotzaeiShabbat ? addDays(today.iso, 6) : candidate, isMotzaeiShabbat }
}

export type ShabbatPhase = 'before' | 'shabbat' | 'after'

/** לפני הדלקת נרות / בשבת / אחרי צאת השבת. */
export function shabbatPhase(
  now: number,
  candleLighting: string | null,
  havdalah: string | null,
  isMotzaeiShabbat: boolean,
): ShabbatPhase {
  if (isMotzaeiShabbat) return 'after'
  if (candleLighting && now < Date.parse(candleLighting)) return 'before'
  if (havdalah && now < Date.parse(havdalah)) return 'shabbat'
  return havdalah ? 'after' : 'before'
}
