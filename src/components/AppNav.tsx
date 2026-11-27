import type { MouseEvent } from 'react'
import { useChecklist } from '../hooks/useChecklist'
import { useIsPhone } from '../hooks/useMedia'
import { useNow } from '../hooks/useNow'
import { navigate, useRoute, type Route } from '../hooks/useRoute'
import { shabbatTasks, tasksOn, useTasks } from '../hooks/useTasks'
import { remainingMs, useTimer } from '../hooks/useTimer'
import { formatClock, israelDay } from '../lib/time'
import { Icon, type IconName } from './ui/Icon'

interface NavItem {
  route: Route
  label: string
  icon: IconName
  tone: string
}

/** בטלפון: חמישה מסכים בסרגל תחתון */
const PHONE_ITEMS: NavItem[] = [
  { route: 'shabbat', label: 'שבת', icon: 'candle', tone: 'info' },
  { route: 'tasks', label: 'משימות', icon: 'list', tone: 'tasks' },
  { route: 'week', label: 'השבוע', icon: 'calendar', tone: 'checklist' },
  { route: 'recipes', label: 'מתכונים', icon: 'chef', tone: 'recipes' },
  { route: 'timer', label: 'טיימר', icon: 'timer', tone: 'timer' },
]

/** במסך רחב: לוח השבת (עם כל הווידג'טים) והשבוע */
const WIDE_ITEMS: NavItem[] = [
  { route: 'shabbat', label: 'הכנות לשבת', icon: 'candle', tone: 'info' },
  { route: 'week', label: 'השבוע', icon: 'calendar', tone: 'checklist' },
]

/** בזמן ריצה הטאב של הטיימר מציג את הזמן שנותר, כדי לראות אותו מכל מסך. */
function useTimerBadge(): { text: string | null; spoken: string | null } {
  const timer = useTimer()
  const now = useNow(timer.status === 'running' ? 1000 : null)
  if (timer.status === 'running' || timer.status === 'paused') {
    const clock = formatClock(remainingMs(timer, now))
    return { text: clock, spoken: `${timer.status === 'paused' ? 'מושהה' : 'נותרו'} ${clock}` }
  }
  if (timer.status === 'done') return { text: 'נגמר!', spoken: 'הזמן נגמר' }
  return { text: null, spoken: null }
}

export function AppNav({ onMenu }: { onMenu: () => void }) {
  const phone = useIsPhone()
  const route = useRoute()
  const { tasks } = useTasks()
  const checklist = useChecklist().items
  const timerBadge = useTimerBadge()
  const now = useNow(60_000)

  const openShabbat =
    shabbatTasks(tasks).filter((t) => !t.done).length + checklist.filter((i) => !i.done).length
  const openToday = tasksOn(tasks, israelDay(now).iso).filter((t) => !t.done).length
  const counts: Partial<Record<Route, number>> = { tasks: openShabbat, week: openToday }

  const items = phone ? PHONE_ITEMS : WIDE_ITEMS
  // במסך רחב כל מה שאינו "השבוע" הוא לוח השבת
  const active: Route = phone ? route : route === 'week' ? 'week' : 'shabbat'

  const go = (event: MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    event.preventDefault()
    navigate(item.route)
  }

  return (
    <nav className="app-nav" aria-label="ניווט ראשי">
      <ul className="app-nav__list container">
        {items.map((item) => {
          const count = phone ? (counts[item.route] ?? 0) : 0
          const isTimer = item.route === 'timer' && timerBadge.text !== null
          const extra = isTimer ? timerBadge.spoken : count > 0 ? `${count} פתוחות` : null
          return (
            <li key={item.route}>
              <a
                href={`#/${item.route}`}
                className={`app-nav__item nav-tone--${item.tone}`}
                aria-current={active === item.route ? 'page' : undefined}
                onClick={(e) => go(e, item)}
              >
                <span className="app-nav__icon">
                  <Icon name={item.icon} size={22} />
                  {count > 0 && (
                    <span className="app-nav__badge" aria-hidden="true">
                      {count}
                    </span>
                  )}
                </span>
                <span
                  className={isTimer ? 'app-nav__label app-nav__label--clock' : 'app-nav__label'}
                  aria-hidden={isTimer || undefined}
                >
                  {isTimer ? timerBadge.text : item.label}
                </span>
                {isTimer && <span className="sr-only">{item.label}</span>}
                {extra && <span className="sr-only">, {extra}</span>}
              </a>
            </li>
          )
        })}
        {!phone && (
          <li className="app-nav__menu">
            <button type="button" className="icon-btn" aria-label="הגדרות ושיתוף" onClick={onMenu}>
              <Icon name="settings" size={24} />
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
