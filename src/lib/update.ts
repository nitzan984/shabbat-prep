import { useSyncExternalStore } from 'react'

/**
 * בדיקת עדכונים: משווים את הגרסה שרצה עכשיו ל־version.json שבאתר.
 * בודקים בפתיחה, כשחוזרים לאפליקציה, ופעם בחצי שעה כשהיא פתוחה.
 */

export const currentBuild = __APP_BUILD__

const MIN_GAP = 60_000
const INTERVAL = 30 * 60_000

let available = false
let lastCheck = 0
const listeners = new Set<() => void>()

function setAvailable(next: boolean) {
  if (next === available) return
  available = next
  listeners.forEach((l) => l())
}

/** מחזיר true אם יש גרסה חדשה יותר באתר. */
export async function checkForUpdate(): Promise<boolean> {
  lastCheck = Date.now()
  try {
    // הפרמטר עוקף מטמון של service worker ישן; no-store עוקף את מטמון הדפדפן
    const response = await fetch(`/version.json?t=${lastCheck}`, { cache: 'no-store' })
    if (!response.ok) return available
    const latest = (await response.json()) as { id?: string }
    if (latest.id && latest.id !== currentBuild.id) setAvailable(true)
  } catch {
    // בלי רשת: ננסה שוב בפעם הבאה
  }
  return available
}

export function applyUpdate() {
  // הדף נטען מהרשת קודם (ראו sw.js), כך שרענון מביא את הגרסה החדשה
  window.location.reload()
}

export function initUpdateCheck() {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return
  const maybeCheck = () => {
    if (document.visibilityState === 'visible' && Date.now() - lastCheck > MIN_GAP) void checkForUpdate()
  }
  window.addEventListener('load', () => setTimeout(maybeCheck, 5_000))
  document.addEventListener('visibilitychange', maybeCheck)
  window.addEventListener('online', maybeCheck)
  setInterval(maybeCheck, INTERVAL)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useUpdateAvailable = () => useSyncExternalStore(subscribe, () => available)

/** "27.11 · 14:05", בשעון ישראל. */
export function formatBuildTime(iso: string) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', timeZone: 'Asia/Jerusalem' })
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' })
  return `${date} · ${time}`
}
