import { useSyncExternalStore } from 'react'
import { fullKey, readJson, writeJson } from './storage'

export interface Store<T> {
  get: () => T
  set: (next: T | ((prev: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

/** Store פשוט בזיכרון, לשימוש עם useSyncExternalStore. */
export function createStore<T>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<() => void>()
  return {
    get: () => state,
    set(next) {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next
      if (Object.is(value, state)) return
      state = value
      listeners.forEach((l) => l())
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/**
 * Store שנשמר ב־localStorage ומסתנכרן בין טאבים.
 * `revive` מאמת את מה שנקרא מהאחסון ומחזיר undefined אם הוא לא תקין.
 */
export function createPersistentStore<T>(
  key: string,
  fallback: () => T,
  revive: (raw: unknown) => T | undefined,
): Store<T> {
  const stored = readJson(key)
  const store = createStore<T>((stored !== undefined && revive(stored)) || fallback())

  const persistentSet: Store<T>['set'] = (next) => {
    store.set(next)
    writeJson(key, store.get())
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== fullKey(key) || event.newValue === null) return
      try {
        const value = revive(JSON.parse(event.newValue))
        if (value !== undefined) store.set(value)
      } catch {
        // התעלמות מערך פגום שהגיע מטאב אחר
      }
    })
  }

  return { ...store, set: persistentSet }
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get)
}

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
