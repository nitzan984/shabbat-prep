import { useRef } from 'react'
import { AppNav } from './components/AppNav'
import { CountdownBar } from './components/header/CountdownBar'
import { InfoCards } from './components/header/InfoCards'
import { SiteHeader } from './components/header/SiteHeader'
import { SummaryChips } from './components/header/SummaryChips'
import { Toasts, TimerAlert, UpdateBanner } from './components/Notices'
import { MenuSheet } from './components/shell/MenuSheet'
import { PhoneAppBar } from './components/shell/PhoneAppBar'
import { PhoneScreen } from './components/shell/Screens'
import { WeekScreen } from './components/week/WeekScreen'
import { WidgetGrid } from './components/widgets/WidgetGrid'
import { WidgetToggles } from './components/widgets/WidgetToggles'
import { useIsPhone } from './hooks/useMedia'
import { useNow } from './hooks/useNow'
import { useRoute } from './hooks/useRoute'
import { useShabbatWeek } from './hooks/useShabbatWeek'
import { useTimer } from './hooks/useTimer'
import { useWeather } from './hooks/useWeather'

export default function App() {
  // רזולוציה של דקה מספיקה כדי להחליף שבוע במוצאי שבת. הספירה לאחור מתעדכנת בעצמה כל שנייה.
  const now = useNow(60_000)
  const week = useShabbatWeek(now)
  const weather = useWeather()
  const alarmOpen = useTimer().status === 'done'
  const phone = useIsPhone()
  const route = useRoute()
  const menuRef = useRef<HTMLDialogElement>(null)
  const openMenu = () => menuRef.current?.showModal()

  return (
    <>
      <div className={phone ? 'app app--phone' : 'app'} inert={alarmOpen}>
        {phone ? (
          <>
            <PhoneAppBar week={week} onMenu={openMenu} />
            <main className={`container main screen screen--${route}`} key={route}>
              <PhoneScreen route={route} week={week} weather={weather} />
            </main>
            <AppNav onMenu={openMenu} />
          </>
        ) : (
          <>
            <a href="#widgets" className="skip-link">
              דילוג לתוכן
            </a>
            <SiteHeader week={week} />
            {/* נשאר למעלה בגלילה: הפס הצהוב והניווט */}
            <div className="sticky-top">
              <CountdownBar week={week} />
              <AppNav onMenu={openMenu} />
            </div>
            <main className="container main">
              {route === 'week' ? (
                <WeekScreen />
              ) : (
                <>
                  <section id="shabbat-info" className="shabbat-info" aria-label="פרטי השבת">
                    <InfoCards week={week} weather={weather} />
                    <SummaryChips />
                  </section>
                  <div id="widgets" className="widgets-area" tabIndex={-1}>
                    <WidgetToggles />
                    <WidgetGrid />
                  </div>
                </>
              )}
            </main>
            <footer className="site-footer container">
              זמנים לרחובות לפי מנהג הספרדים (הדלקה 20 דק׳ לפני השקיעה, צאת השבת 8.5°). נתונים: Hebcal ו־Open-Meteo.
            </footer>
          </>
        )}
      </div>
      <MenuSheet ref={menuRef} />
      <TimerAlert />
      <UpdateBanner />
      <Toasts />
    </>
  )
}
