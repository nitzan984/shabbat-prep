import type { ShabbatWeekView } from '../../hooks/useShabbatWeek'
import { Icon } from '../ui/Icon'

export function SiteHeader({ week }: { week: ShabbatWeekView }) {
  const data = week.query.data
  const hebrewDate = data?.hebrewDates[week.saturday]
  const subtitle = data
    ? [data.title ? `שבת ${data.title}` : 'שבת', hebrewDate].filter(Boolean).join(' · ')
    : null

  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <span className="site-header__logo" aria-hidden="true">
          <Icon name="candle" size={34} />
        </span>
        <div>
          <h1 className="site-header__title">מכינים שבת</h1>
          <p className="site-header__subtitle">
            {subtitle ?? (week.query.status === 'error' ? 'לא הצלחנו לטעון את פרטי השבת' : 'טוען את פרטי השבת…')}
          </p>
        </div>
      </div>
    </header>
  )
}
