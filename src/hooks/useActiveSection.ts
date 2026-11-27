import { useSyncExternalStore } from 'react'

/**
 * איזה אזור בדף נמצא כרגע מתחת לפס העליון, בשביל הסימון בניווט.
 * store חיצוני שמאזין לגלילה רק כל עוד יש מנויים, בלי useEffect.
 */

export const NAV_TARGETS = ['shabbat-info', 'widget-timer', 'widget-tasks', 'widget-checklist', 'widget-recipes'] as const
export type NavTarget = (typeof NAV_TARGETS)[number]

let active: NavTarget = 'shabbat-info'
let frame = 0
/** אחרי לחיצה בניווט: לא מחשבים מחדש בזמן הגלילה החלקה, כדי שהסימון לא יקפוץ בדרך */
let lockedUntil = 0
const listeners = new Set<() => void>()

function stickyOffset(): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--sticky-offset')
  return Number.parseFloat(value) || 96
}

function setActive(next: NavTarget) {
  if (next === active) return
  active = next
  listeners.forEach((l) => l())
}

function compute() {
  frame = 0
  if (Date.now() < lockedUntil) return
  const line = stickyOffset() + 24
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  const present = NAV_TARGETS.map((id) => ({ id, el: document.getElementById(id) }))
    .filter((t): t is { id: NavTarget; el: HTMLElement } => t.el !== null)
    .map((t) => ({ id: t.id, top: t.el.getBoundingClientRect().top }))
    .sort((a, b) => a.top - b.top)

  // האזור האחרון שהחלק העליון שלו כבר עבר את הקו. בתחתית הדף: האחרון בדף.
  let next: NavTarget = 'shabbat-info'
  for (const t of present) if (t.top <= line) next = t.id
  if (atBottom && present.length > 0) next = present[present.length - 1].id
  setActive(next)
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(compute)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }
}

/** לקרוא אחרי שינוי שמזיז אזורים בלי גלילה (הסתרה, שינוי סדר). */
export const refreshActiveSection = schedule

/** לחיצה בניווט: מסמנים מיד את היעד, וחוזרים למעקב אחרי הגלילה כשהיא נגמרת. */
export function jumpToSection(target: NavTarget) {
  setActive(target)
  lockedUntil = Date.now() + 1000
  setTimeout(schedule, 1050)
}

export const useActiveSection = () => useSyncExternalStore(subscribe, () => active)
