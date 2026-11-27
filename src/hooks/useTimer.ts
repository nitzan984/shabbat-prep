import { cancelAlarm, scheduleAlarm, unlockAudio, vibrate } from '../lib/alarm'
import { createPersistentStore, useStore } from '../lib/store'

/**
 * טיימר מבוסס endAt: בזמן ריצה שומרים רק את חותמת הזמן של הסיום,
 * והזמן שנותר מחושב מהשעון. כך הוא מדויק גם ברקע וגם אחרי רענון.
 */

const MINUTE = 60_000
const MAX_MS = 10 * 60 * MINUTE
/** טיימר שהסתיים מזמן (בזמן שהאתר היה סגור) לא מציג התראה */
const STALE_DONE_MS = 30 * MINUTE

interface Base {
  /** אורך הטיימר המלא, לטבעת ההתקדמות ולאיפוס */
  durationMs: number
  /** למשל "חלה מתוקה" כשהטיימר כוון ממתכון */
  label: string | null
}

export type TimerState =
  | (Base & { status: 'idle' })
  | (Base & { status: 'running'; endAt: number })
  | (Base & { status: 'paused'; remainingMs: number })
  | (Base & { status: 'done'; finishedAt: number })

const isTimerState = (v: unknown): v is TimerState => {
  const s = v as TimerState
  if (typeof s !== 'object' || s === null || typeof s.durationMs !== 'number') return false
  switch (s.status) {
    case 'idle':
      return true
    case 'running':
      return typeof s.endAt === 'number'
    case 'paused':
      return typeof s.remainingMs === 'number'
    case 'done':
      return typeof s.finishedAt === 'number'
    default:
      return false
  }
}

const timerStore = createPersistentStore<TimerState>(
  'timer',
  () => ({ status: 'idle', durationMs: 10 * MINUTE, label: null }),
  (raw) => (isTimerState(raw) ? { ...raw, label: raw.label ?? null } : undefined),
)

export function remainingMs(state: TimerState, now: number): number {
  switch (state.status) {
    case 'idle':
      return state.durationMs
    case 'running':
      return Math.max(0, state.endAt - now)
    case 'paused':
      return state.remainingMs
    case 'done':
      return 0
  }
}

// ---------- תזמון הסיום ----------

let timeoutId: ReturnType<typeof setTimeout> | undefined
let scheduledEndAt: number | null = null
let alarmArmed = false

function finish() {
  const s = timerStore.get()
  if (s.status !== 'running') return
  if (Date.now() < s.endAt - 50) {
    // ה־timeout קפץ מוקדם (למשל אחרי שינה של המכשיר): מתזמנים שוב
    scheduledEndAt = null
    sync()
    return
  }
  scheduledEndAt = null
  clearTimeout(timeoutId)
  if (Date.now() - s.endAt > STALE_DONE_MS) {
    timerStore.set({ status: 'idle', durationMs: s.durationMs, label: s.label })
    return
  }
  timerStore.set({ status: 'done', durationMs: s.durationMs, label: s.label, finishedAt: s.endAt })
  if (!alarmArmed) scheduleAlarm(Date.now())
  vibrate()
}

/** מיישר את ה־setTimeout והצליל למצב ב־store (כולל שינוי מטאב אחר). */
function sync() {
  const s = timerStore.get()
  if (s.status === 'running') {
    if (scheduledEndAt === s.endAt) return
    clearTimeout(timeoutId)
    scheduledEndAt = s.endAt
    alarmArmed = scheduleAlarm(s.endAt)
    timeoutId = setTimeout(finish, Math.max(0, s.endAt - Date.now()))
    return
  }
  clearTimeout(timeoutId)
  scheduledEndAt = null
  if (s.status !== 'done') {
    cancelAlarm()
    alarmArmed = false
  }
}

timerStore.subscribe(sync)
sync()

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    const s = timerStore.get()
    if (document.visibilityState === 'visible' && s.status === 'running' && Date.now() >= s.endAt) {
      finish()
    }
  })
}

// ---------- פעולות ----------

const clamp = (ms: number) => Math.min(MAX_MS, Math.max(0, ms))

function run(durationMs: number, label: string | null, remaining = durationMs) {
  unlockAudio()
  timerStore.set({ status: 'running', durationMs, label, endAt: Date.now() + remaining })
}

export const timerActions = {
  start() {
    const s = timerStore.get()
    if (s.status === 'paused') run(s.durationMs, s.label, s.remainingMs)
    else if (s.status !== 'running' && s.durationMs > 0) run(s.durationMs, s.label)
  },
  pause() {
    const s = timerStore.get()
    if (s.status !== 'running') return
    timerStore.set({
      status: 'paused',
      durationMs: s.durationMs,
      label: s.label,
      remainingMs: Math.max(0, s.endAt - Date.now()),
    })
  },
  reset() {
    const s = timerStore.get()
    timerStore.set({ status: 'idle', durationMs: s.durationMs, label: s.label })
  },
  dismiss() {
    const s = timerStore.get()
    if (s.status === 'done') timerStore.set({ status: 'idle', durationMs: s.durationMs, label: s.label })
  },
  /** ‎+1/+5/−1/−5 דקות. בזמן ריצה מזיז את endAt. */
  adjust(deltaMinutes: number) {
    const delta = deltaMinutes * MINUTE
    const s = timerStore.get()
    const now = Date.now()
    if (s.status === 'idle') {
      timerStore.set({ ...s, durationMs: clamp(s.durationMs + delta), label: s.label })
    } else if (s.status === 'running' || s.status === 'paused') {
      const next = remainingMs(s, now) + delta
      if (next < 1000 || next > MAX_MS) return
      const durationMs = clamp(Math.max(s.durationMs + delta, next))
      timerStore.set(
        s.status === 'running'
          ? { ...s, durationMs, endAt: s.endAt + delta }
          : { ...s, durationMs, remainingMs: next },
      )
    }
  },
  /** זמנים מהירים ושדה חופשי: מכוונים ומתחילים מיד. */
  startMinutes(minutes: number, label: string | null = null) {
    const ms = clamp(minutes * MINUTE)
    if (ms > 0) run(ms, label)
  },
  /** מתכון: מכוונים את הטיימר בלי להפעיל, עם שם המתכון. */
  setMinutes(minutes: number, label: string | null) {
    timerStore.set({ status: 'idle', durationMs: clamp(minutes * MINUTE), label })
  },
}

export function canAdjust(state: TimerState, now: number, deltaMinutes: number): boolean {
  if (state.status === 'done') return false
  const next = remainingMs(state, now) + deltaMinutes * MINUTE
  if (state.status === 'idle') return next >= 0 && next <= MAX_MS && (deltaMinutes > 0 || state.durationMs > 0)
  return next >= 1000 && next <= MAX_MS
}

export const useTimer = () => useStore(timerStore)
