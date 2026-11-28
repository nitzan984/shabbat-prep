import { useEffect, useRef } from 'react'
import type { ShabbatWeekView } from '../../hooks/useShabbatWeek'
import { CountdownBar } from '../header/CountdownBar'
import { Icon } from '../ui/Icon'

/** סרגל עליון קומפקטי לטלפון: שם, פרשה, הגדרות, ומתחתיו הפס הצהוב. */
export function PhoneAppBar({ week, onMenu }: { week: ShabbatWeekView; onMenu: () => void }) {
  const data = week.query.data
  const subtitle = data
    ? [data.title, data.hebrewDates[week.saturday]].filter(Boolean).join(' · ')
    : 'טוען את פרטי השבת…'
  const ref = useRef<HTMLElement>(null)

  // הגובה של הסרגל ב־--appbar-h, כדי שמסכים כמו הטיימר ימלאו בדיוק את שאר המסך
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const root = document.documentElement.style
    const observer = new ResizeObserver(() => root.setProperty('--appbar-h', `${el.offsetHeight}px`))
    observer.observe(el)
    return () => {
      observer.disconnect()
      root.removeProperty('--appbar-h')
    }
  }, [])

  return (
    <header className="appbar" ref={ref}>
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
