import { useSyncExternalStore } from 'react'

/**
 * התקנה כאפליקציה (PWA): באנדרואיד Chrome שולח beforeinstallprompt,
 * ושומרים אותו כדי להציג כפתור "התקנה" משלנו.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallState = 'installed' | 'available' | 'ios' | 'unavailable'

let deferred: InstallPromptEvent | null = null
let state: InstallState = 'unavailable'
const listeners = new Set<() => void>()

function set(next: InstallState) {
  if (next === state) return
  state = next
  listeners.forEach((l) => l())
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window)

export function initPwa() {
  if (typeof window === 'undefined') return
  state = isStandalone() ? 'installed' : isIos() ? 'ios' : 'unavailable'

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as InstallPromptEvent
    set('available')
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    set('installed')
  })

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      void navigator.serviceWorker.register('/sw.js')
    })
  }
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  await deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  if (outcome === 'accepted') set('installed')
  else set('unavailable')
  return outcome === 'accepted'
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const useInstallState = () => useSyncExternalStore(subscribe, () => state)
