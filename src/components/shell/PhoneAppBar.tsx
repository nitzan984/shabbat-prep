import type { ShabbatWeekView } from '../../hooks/useShabbatWeek'
import { CountdownBar } from '../header/CountdownBar'
import { Icon } from '../ui/Icon'

/** סרגל עליון קומפקטי לטלפון: שם, פרשה, הגדרות, ומתחתיו הפס הצהוב. */
export function PhoneAppBar({ week, onMenu }: { week: ShabbatWeekView; onMenu: () => void }) {
  const data = week.query.data
  const subtitle = data
    ? [data.title, data.hebrewDates[week.saturday]].filter(Boolean).join(' · ')
    : 'טוען את פרטי השבת…'

  return (
    <header className="appbar">
      <div className="appbar__row">
        <span className="appbar__logo" aria-hidden="true">
          <Icon name="candle" size={24} />
        </span>
        <div className="appbar__titles">
          <h1 className="appbar__title">מכינים שבת</h1>
          <p className="appbar__subtitle">{subtitle}</p>
        </div>
        <button type="button" className="icon-btn icon-btn--on-color" aria-label="הגדרות ושיתוף" onClick={onMenu}>
          <Icon name="settings" />
        </button>
      </div>
      <CountdownBar week={week} compact />
    </header>
  )
}
