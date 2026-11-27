import { useNow } from '../../hooks/useNow'
import type { ShabbatWeekView } from '../../hooks/useShabbatWeek'
import { formatCountdown, formatTime } from '../../lib/time'
import { shabbatPhase } from '../../lib/week'
import { Icon } from '../ui/Icon'
import { RetryButton } from '../ui/InfoCard'

/** הפס הצהוב: ספירה לאחור חיה, "שבת שלום!" או "שבוע טוב!". */
export function CountdownBar({ week }: { week: ShabbatWeekView }) {
  const now = useNow(1000)
  const { data, status, isFetching, refetch } = week.query

  if (!data) {
    return (
      <div className="countdown" aria-busy={status === 'loading'}>
        <div className="countdown__inner container">
          <Icon name="candle" size={30} className="countdown__icon" />
          {status === 'error' ? (
            <>
              <p className="countdown__main">לא הצלחנו לטעון את זמני השבת</p>
              <RetryButton onRetry={refetch} busy={isFetching} />
            </>
          ) : (
            <p className="countdown__main countdown__main--loading">טוען זמני שבת…</p>
          )}
        </div>
      </div>
    )
  }

  const phase = shabbatPhase(now, data.candleLighting, data.havdalah, week.isMotzaeiShabbat)
  const main =
    phase === 'before' && data.candleLighting
      ? `${formatCountdown(Date.parse(data.candleLighting) - now)} להדלקת נרות`
      : phase === 'shabbat'
        ? 'שבת שלום!'
        : 'שבוע טוב!'

  return (
    <div className={`countdown countdown--${phase}`}>
      <div className="countdown__inner container">
        <Icon name={phase === 'shabbat' ? 'candle' : phase === 'after' ? 'moon' : 'clock'} size={30} className="countdown__icon" />
        <div className="countdown__text">
          <p className="countdown__main">{main}</p>
          {phase === 'after' && data.title && (
            <p className="countdown__hint">השבת הבאה: {data.title}</p>
          )}
        </div>
        <dl className="countdown__times">
          <div>
            <dt>הדלקת נרות</dt>
            <dd>{formatTime(data.candleLighting)}</dd>
          </div>
          <div>
            <dt>צאת השבת</dt>
            <dd>{formatTime(data.havdalah)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
