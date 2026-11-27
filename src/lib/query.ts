import { useCallback, useSyncExternalStore } from 'react'
import { readJson, removeKey, writeJson } from './storage'

/**
 * מטמון קטן ל־server state (Hebcal, מזג אוויר, הנתונים המשותפים של המשפחה),
 * בהשראת TanStack Query: כל שאילתה מזוהה במפתח, נשמרת בזיכרון ואופציונלית
 * ב־localStorage, ונמשכת כשקומפוננטה נרשמת אליה והנתונים ישנים. בלי useEffect.
 * שינויים (mutate) מוצגים מיד (אופטימי) ואחר כך מתיישבים מול השרת.
 */

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error'

export interface QueryState<T> {
  status: QueryStatus
  data: T | undefined
  error: Error | undefined
  updatedAt: number | undefined
  isFetching: boolean
}

export interface QueryDef<P extends string, T> {
  name: string
  fetch: (param: P, signal: AbortSignal) => Promise<T>
  /** אחרי כמה זמן הנתונים נחשבים ישנים (Infinity = לעולם לא) */
  staleTime: number
  /** רענון תקופתי כל עוד יש מי שמציג את השאילתה והדף גלוי */
  refetchInterval?: number
  /** שמירה ב־localStorage. keep = כמה מפתחות אחרונים לשמור מאותו סוג */
  persist?: { keep: number }
}

interface Entry {
  key: string
  state: QueryState<unknown>
  listeners: Set<() => void>
  inFlight?: Promise<void>
  intervalId?: ReturnType<typeof setInterval>
  /** שינויים שעדיין לא חזרו מהשרת */
  mutating: number
  /** מתי התחיל השינוי האחרון: קריאה שהתחילה לפניו כבר לא אמינה */
  lastMutationAt: number
  run: (signal: AbortSignal) => Promise<unknown>
  def: QueryDef<string, unknown>
}

interface Persisted {
  data: unknown
  updatedAt: number
}

const entries = new Map<string, Entry>()
const REQUEST_TIMEOUT_MS = 15_000

const IDLE: QueryState<never> = {
  status: 'idle',
  data: undefined,
  error: undefined,
  updatedAt: undefined,
  isFetching: false,
}

const storageKey = (key: string) => `query:${key}`
const indexKey = (name: string) => `query-index:${name}`

function getEntry<P extends string, T>(def: QueryDef<P, T>, param: P): Entry {
  const key = `${def.name}:${param}`
  let entry = entries.get(key)
  if (!entry) {
    const persisted = def.persist ? (readJson(storageKey(key)) as Persisted | undefined) : undefined
    const hasPersisted = persisted !== undefined && typeof persisted.updatedAt === 'number'
    entry = {
      key,
      state: {
        status: hasPersisted ? 'success' : 'loading',
        data: hasPersisted ? persisted.data : undefined,
        error: undefined,
        updatedAt: hasPersisted ? persisted.updatedAt : undefined,
        isFetching: false,
      },
      listeners: new Set(),
      mutating: 0,
      lastMutationAt: 0,
      run: (signal) => def.fetch(param, signal),
      def: def as QueryDef<string, unknown>,
    }
    entries.set(key, entry)
  }
  return entry
}

function update(entry: Entry, patch: Partial<QueryState<unknown>>) {
  entry.state = { ...entry.state, ...patch }
  entry.listeners.forEach((l) => l())
}

function persist(entry: Entry, data: unknown, updatedAt: number) {
  const keep = entry.def.persist?.keep
  if (!keep) return
  writeJson(storageKey(entry.key), { data, updatedAt } satisfies Persisted)
  const index = (readJson(indexKey(entry.def.name)) as string[] | undefined) ?? []
  const next = [entry.key, ...index.filter((k) => k !== entry.key)]
  next.slice(keep).forEach((old) => removeKey(storageKey(old)))
  writeJson(indexKey(entry.def.name), next.slice(0, keep))
}

const isStale = (entry: Entry) =>
  entry.state.updatedAt === undefined || Date.now() - entry.state.updatedAt > entry.def.staleTime

function fetchEntry(entry: Entry): Promise<void> {
  if (entry.inFlight) return entry.inFlight
  const startedAt = Date.now()
  update(entry, {
    isFetching: true,
    status: entry.state.data === undefined ? 'loading' : entry.state.status,
  })
  entry.inFlight = entry
    .run(AbortSignal.timeout(REQUEST_TIMEOUT_MS))
    .then(
      (data) => {
        // שינוי מקומי התחיל אחרי שהקריאה יצאה: התשובה לא כוללת אותו, אז לא דורסים
        if (entry.mutating > 0 || entry.lastMutationAt >= startedAt) {
          update(entry, { isFetching: false })
          return
        }
        const updatedAt = Date.now()
        persist(entry, data, updatedAt)
        update(entry, { status: 'success', data, error: undefined, updatedAt, isFetching: false })
      },
      (error: unknown) => {
        update(entry, {
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
          isFetching: false,
        })
      },
    )
    .finally(() => {
      entry.inFlight = undefined
    })
  return entry.inFlight
}

const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible'

function subscribeEntry(entry: Entry, listener: () => void) {
  entry.listeners.add(listener)
  if (entry.listeners.size === 1 && entry.def.refetchInterval) {
    entry.intervalId = setInterval(() => {
      if (isVisible()) void fetchEntry(entry)
    }, entry.def.refetchInterval)
  }
  if (isStale(entry)) void fetchEntry(entry)
  return () => {
    entry.listeners.delete(listener)
    if (entry.listeners.size === 0 && entry.intervalId !== undefined) {
      clearInterval(entry.intervalId)
      entry.intervalId = undefined
    }
  }
}

/** חזרה לטאב או חזרת רשת: מרעננים כל שאילתה פעילה שהתיישנה. */
function refreshActiveStale() {
  entries.forEach((entry) => {
    if (entry.listeners.size > 0 && isStale(entry)) void fetchEntry(entry)
  })
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (isVisible()) refreshActiveStale()
  })
  window.addEventListener('online', refreshActiveStale)
}

export function defineQuery<P extends string, T>(def: QueryDef<P, T>): QueryDef<P, T> {
  return def
}

const noop = () => {}
const idleSubscribe = () => noop
const idleSnapshot = () => IDLE

export function useQuery<P extends string, T>(
  def: QueryDef<P, T>,
  param: P,
  { enabled = true }: { enabled?: boolean } = {},
): QueryState<T> & { refetch: () => void } {
  const subscribe = useCallback(
    (listener: () => void) => subscribeEntry(getEntry(def, param), listener),
    [def, param],
  )
  const getSnapshot = useCallback(() => getEntry(def, param).state, [def, param])
  const state = useSyncExternalStore(
    enabled ? subscribe : idleSubscribe,
    enabled ? getSnapshot : idleSnapshot,
  ) as QueryState<T>
  const refetch = useCallback(() => void fetchEntry(getEntry(def, param)), [def, param])
  return { ...state, refetch }
}

/** הנתונים הנוכחיים במטמון, מחוץ לקומפוננטה (למשל לבדוק כפילות לפני הוספה) */
export function getQueryData<P extends string, T>(def: QueryDef<P, T>, param: P): T | undefined {
  return getEntry(def, param).state.data as T | undefined
}

/**
 * שינוי אופטימי: מעדכן את המטמון מיד, שולח לשרת, ובסוף קורא מחדש מהשרת
 * (גם בהצלחה, כדי להתיישר עם שינויים של אחרים; גם בכישלון, כדי לחזור לאמת).
 */
export async function mutate<P extends string, T>(
  def: QueryDef<P, T>,
  param: P,
  optimistic: (data: T) => T,
  request: () => Promise<unknown>,
): Promise<boolean> {
  const entry = getEntry(def, param)
  entry.mutating++
  entry.lastMutationAt = Date.now()
  if (entry.state.data !== undefined) update(entry, { data: optimistic(entry.state.data as T) })
  let ok = true
  try {
    await request()
  } catch {
    ok = false
  } finally {
    entry.mutating--
  }
  if (entry.mutating === 0) {
    // אם קריאה ישנה עדיין באוויר, מחכים לה ואז קוראים שוב
    if (entry.inFlight) await entry.inFlight
    void fetchEntry(entry)
  }
  return ok
}
