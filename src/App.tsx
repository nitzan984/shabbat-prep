import { AppNav } from './components/AppNav'
import { CountdownBar } from './components/header/CountdownBar'
import { InfoCards } from './components/header/InfoCards'
import { SiteHeader } from './components/header/SiteHeader'
import { SummaryChips } from './components/header/SummaryChips'
import { Toasts, TimerAlert } from './components/Notices'
import { WidgetGrid } from './components/widgets/WidgetGrid'
import { WidgetToggles } from './components/widgets/WidgetToggles'
import { useNow } from './hooks/useNow'
import { useShabbatWeek } from './hooks/useShabbatWeek'
import { useTimer } from './hooks/useTimer'
import { useWeather } from './hooks/useWeather'

export default function App() {
  // רזולוציה של דקה מספיקה כדי להחליף שבוע במוצאי שבת. הספירה לאחור מתעדכנת בעצמה כל שנייה.
  const now = useNow(60_000)
  const week = useShabbatWeek(now)
  const weather = useWeather()
  const alarmOpen = useTimer().status === 'done'

  return (
    <>
      <div className="app" inert={alarmOpen}>
        <a href="#widgets" className="skip-link">
          דילוג לווידג'טים
        </a>
        <SiteHeader week={week} />
        {/* נשאר למעלה בגלילה: הפס הצהוב, ובמסך רחב גם הניווט. בטלפון הניווט יורד לתחתית. */}
        <div className="sticky-top">
          <CountdownBar week={week} />
          <AppNav />
        </div>
        <main className="container main">
          <section id="shabbat-info" className="shabbat-info" aria-label="פרטי השבת" tabIndex={-1}>
            <InfoCards week={week} weather={weather} />
            <SummaryChips />
          </section>
          <div id="widgets" className="widgets-area" tabIndex={-1}>
            <WidgetToggles />
            <WidgetGrid />
          </div>
        </main>
        <footer className="site-footer container">
          זמנים לרחובות לפי מנהג הספרדים (הדלקה 20 דק׳ לפני השקיעה, צאת השבת 8.5°). נתונים: Hebcal ו־Open-Meteo.
        </footer>
      </div>
      <TimerAlert />
      <Toasts />
    </>
  )
}
