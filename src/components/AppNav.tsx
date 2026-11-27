import type { MouseEvent } from 'react'
import { jumpToSection, useActiveSection, type NavTarget } from '../hooks/useActiveSection'
import { useChecklist } from '../hooks/useChecklist'
import { shabbatTasks, useTasks } from '../hooks/useTasks'
import { layoutActions, type WidgetId } from '../hooks/useLayout'
import { useNow } from '../hooks/useNow'
import { remainingMs, useTimer } from '../hooks/useTimer'
import { formatClock } from '../lib/time'
import { Icon, type IconName } from './ui/Icon'
import { revealWidget } from './widgets/reveal'

interface NavItem {
  target: NavTarget
  widget: WidgetId | null
  label: string
  icon: IconName
  tone: string
}

const ITEMS: NavItem[] = [
  { target: 'shabbat-info', widget: null, label: 'שבת', icon: 'candle', tone: 'info' },
  { target: 'widget-timer', widget: 'timer', label: 'טיימר', icon: 'timer', tone: 'timer' },
  { target: 'widget-tasks', widget: 'tasks', label: 'מטלות', icon: 'list', tone: 'tasks' },
  { target: 'widget-checklist', widget: 'checklist', label: 'לא לשכוח', icon: 'clipboard', tone: 'checklist' },
  { target: 'widget-recipes', widget: 'recipes', label: 'מתכונים', icon: 'chef', tone: 'recipes' },
]

/** בזמן ריצה הטאב של הטיימר מציג את הזמן שנותר, כדי לראות אותו מכל מקום בדף. */
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

/** ניווט ראשי: בטלפון פס תחתון, באייפד ובמחשב פס עליון (CSS מחליט). */
export function AppNav() {
  const active = useActiveSection()
  const tasksLeft = shabbatTasks(useTasks().tasks).filter((t) => !t.done).length
  const checklistLeft = useChecklist().items.filter((t) => !t.done).length
  const timerBadge = useTimerBadge()

  const go = (event: MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    event.preventDefault()
    if (item.widget) {
      layoutActions.show(item.widget)
      revealWidget(item.widget)
    } else {
      const el = document.getElementById(item.target)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      el?.focus({ preventScroll: true })
    }
    jumpToSection(item.target)
  }

  return (
    <nav className="app-nav" aria-label="ניווט ראשי">
      <ul className="app-nav__list container">
        {ITEMS.map((item) => {
          const count = item.widget === 'tasks' ? tasksLeft : item.widget === 'checklist' ? checklistLeft : 0
          const isTimer = item.widget === 'timer' && timerBadge.text !== null
          const extra = isTimer ? timerBadge.spoken : count > 0 ? `${count} נותרו` : null
          return (
            <li key={item.target}>
              <a
                href={`#${item.target}`}
                className={`app-nav__item nav-tone--${item.tone}`}
                aria-current={active === item.target ? 'location' : undefined}
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
                <span className={isTimer ? 'app-nav__label app-nav__label--clock' : 'app-nav__label'} aria-hidden={isTimer || undefined}>
                  {isTimer ? timerBadge.text : item.label}
                </span>
                {isTimer && <span className="sr-only">{item.label}</span>}
                {extra && <span className="sr-only">, {extra}</span>}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
