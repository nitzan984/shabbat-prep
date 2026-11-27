import { useCallback, useSyncExternalStore } from 'react'

/**
 * שעון משותף. כל רזולוציה (שנייה, דקה...) היא store נפרד, כך שקומפוננטה
 * שצריכה רק דקות לא מתרנדרת כל שנייה.
 */

interface Ticker {
  value: number
  listeners: Set<() => void>
  intervalId?: ReturnType<typeof setInterval>
}

const tickers = new Map<number, Ticker>()
const floorTo = (ms: number, granularity: number) => Math.floor(ms / granularity) * granularity

function getTicker(granularity: number): Ticker {
  let ticker = tickers.get(granularity)
  if (!ticker) {
    ticker = { value: floorTo(Date.now(), granularity), listeners: new Set() }
    tickers.set(granularity, ticker)
  }
  return ticker
}

function tick(ticker: Ticker, granularity: number) {
  const value = floorTo(Date.now(), granularity)
  if (value === ticker.value) return
  ticker.value = value
  ticker.listeners.forEach((l) => l())
}

function subscribe(granularity: number, listener: () => void) {
  const ticker = getTicker(granularity)
  ticker.listeners.add(listener)
  if (ticker.intervalId === undefined) {
    tick(ticker, granularity)
    ticker.intervalId = setInterval(() => tick(ticker, granularity), Math.min(granularity, 1000))
  }
  return () => {
    ticker.listeners.delete(listener)
    if (ticker.listeners.size === 0 && ticker.intervalId !== undefined) {
      clearInterval(ticker.intervalId)
      ticker.intervalId = undefined
    }
  }
}

function read(granularity: number): number {
  const ticker = getTicker(granularity)
  // בלי מנויים אין אינטרוול שמעדכן, אז מעדכנים בקריאה
  if (ticker.listeners.size === 0) ticker.value = floorTo(Date.now(), granularity)
  return ticker.value
}

/** הזמן הנוכחי (epoch ms), מעוגל לרזולוציה. null = בלי עדכונים חיים. */
export function useNow(granularity: number | null = 1000): number {
  const g = granularity ?? 0
  const sub = useCallback(
    (listener: () => void) => (g > 0 ? subscribe(g, listener) : () => {}),
    [g],
  )
  const snapshot = useCallback(() => (g > 0 ? read(g) : read(60_000)), [g])
  return useSyncExternalStore(sub, snapshot)
}
