import { useSyncExternalStore } from 'react'

/** טלפון = מסך צר מ־740px. אייפד ומחשב מקבלים את לוח הווידג'טים. */
const PHONE_QUERY = '(max-width: 739.98px)'

const mql = typeof window !== 'undefined' ? window.matchMedia(PHONE_QUERY) : null

const subscribe = (listener: () => void) => {
  mql?.addEventListener('change', listener)
  return () => mql?.removeEventListener('change', listener)
}

export const isPhone = () => mql?.matches ?? false

export const useIsPhone = () => useSyncExternalStore(subscribe, isPhone)
