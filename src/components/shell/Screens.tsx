import type { Route } from '../../hooks/useRoute'
import type { ShabbatWeekView } from '../../hooks/useShabbatWeek'
import type { useWeather } from '../../hooks/useWeather'
import { InfoCards } from '../header/InfoCards'
import { SummaryChips } from '../header/SummaryChips'
import { WeekScreen } from '../week/WeekScreen'
import { ChecklistWidget } from '../widgets/ChecklistWidget'
import { RecipesWidget } from '../widgets/RecipesWidget'
import { TasksWidget } from '../widgets/TasksWidget'
import { TimerWidget } from '../widgets/TimerWidget'
import { Panel } from './Panel'

type WeatherQuery = ReturnType<typeof useWeather>

/** תוכן המסך הנוכחי בטלפון. כל טאב בסרגל התחתון הוא מסך משלו. */
export function PhoneScreen({ route, week, weather }: { route: Route; week: ShabbatWeekView; weather: WeatherQuery }) {
  switch (route) {
    case 'shabbat':
      return (
        <>
          <SummaryChips />
          <InfoCards week={week} weather={weather} />
        </>
      )
    case 'tasks':
      return (
        <>
          <Panel id="widget-tasks" tone="tasks" icon="list" title="מטלות לשבת">
            <TasksWidget />
          </Panel>
          <Panel id="widget-checklist" tone="checklist" icon="clipboard" title="לא לשכוח לפני שבת">
            <ChecklistWidget />
          </Panel>
        </>
      )
    case 'week':
      return <WeekScreen />
    case 'recipes':
      return (
        <Panel id="widget-recipes" tone="recipes" icon="chef" title="המתכונים שלי">
          <RecipesWidget />
        </Panel>
      )
    case 'timer':
      return (
        <Panel id="widget-timer" tone="timer" icon="timer" title="טיימר">
          <TimerWidget />
        </Panel>
      )
  }
}
