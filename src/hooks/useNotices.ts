import { createStore, newId, useStore } from '../lib/store'

/** הודעות קצרות על המסך ("נוסף למטלות") והכרזות לקוראי מסך. */

export interface Toast {
  id: string
  message: string
}

const toastStore = createStore<Toast[]>([])
const announceStore = createStore('')

export function showToast(message: string) {
  const id = newId()
  toastStore.set((list) => [...list.slice(-2), { id, message }])
  setTimeout(() => toastStore.set((list) => list.filter((t) => t.id !== id)), 3500)
}

/** טקסט לקוראי מסך בלבד, למשל אחרי הזזת ווידג'ט. */
export function announce(message: string) {
  // ריקון ואז כתיבה, כדי שהודעה זהה תוכרז שוב
  announceStore.set('')
  setTimeout(() => announceStore.set(message), 50)
}

export const useToasts = () => useStore(toastStore)
export const useAnnouncement = () => useStore(announceStore)
