import { useSyncExternalStore } from 'react'
import { israelDay } from '../lib/time'

/**
 * המסך הנוכחי, לפי ה־hash בכתובת (#/tasks). בטלפון כל טאב בסרגל התחתון הוא מסך;
 * במסך רחב יש שני מסכים: לוח השבת והשבוע.
 */

export const ROUTES = ['shabbat', 'tasks', 'week', 'recipes', 'timer'] as const
export type Route = (typeof ROUTES)[number]

const parse = (hash: string): Route | null => {
  const name = hash.replace(/^#\/?/, '').split(/[?&]/)[0]
  return ROUTES.includes(name as Route) ? (name as Route) : null
}

/** בלי hash: ראשון–חמישי נפתח על השבוע, שישי ושבת על הכנות לשבת */
const defaultRoute = (): Route => (israelDay(Date.now()).weekday <= 4 ? 'week' : 'shabbat')

let current: Route = typeof location === 'undefined' ? 'shabbat' : (parse(location.hash) ?? defaultRoute())
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const next = parse(location.hash)
    if (next && next !== current) {
      current = next
      emit()
    }
  })
}

/** מעבר מסך. replaceState: כמו סרגל ניווט של אפליקציה, בלי לערום היסטוריה. */
export function navigate(route: Route) {
  if (route !== current) {
    current = route
    history.replaceState(null, '', `#/${route}`)
    emit()
  }
  window.scrollTo({ top: 0 })
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useRoute = () => useSyncExternalStore(subscribe, () => current)
