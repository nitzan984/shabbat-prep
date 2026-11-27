import { createPersistentStore, newId, useStore, type Store } from '../lib/store'

export interface CheckItem {
  id: string
  text: string
  done: boolean
}

const isCheckItem = (v: unknown): v is CheckItem =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as CheckItem).id === 'string' &&
  typeof (v as CheckItem).text === 'string' &&
  typeof (v as CheckItem).done === 'boolean'

const reviveItems = (raw: unknown) =>
  Array.isArray(raw) && raw.every(isCheckItem) ? (raw as CheckItem[]) : undefined

const fromTexts = (texts: string[]): CheckItem[] =>
  texts.map((text) => ({ id: newId(), text, done: false }))

function createCheckListStore(key: string, defaults: string[]) {
  return createPersistentStore(key, () => fromTexts(defaults), reviveItems)
}

function actionsFor(store: Store<CheckItem[]>) {
  return {
    add(text: string) {
      const clean = text.trim()
      if (!clean) return false
      store.set((items) => [...items, { id: newId(), text: clean, done: false }])
      return true
    },
    toggle: (id: string) =>
      store.set((items) => items.map((i) => (i.id === id ? { ...i, done: !i.done } : i))),
    remove: (id: string) => store.set((items) => items.filter((i) => i.id !== id)),
    clearDone: () => store.set((items) => items.filter((i) => !i.done)),
    uncheckAll: () => store.set((items) => items.map((i) => (i.done ? { ...i, done: false } : i))),
  }
}

export const tasksStore = createCheckListStore('tasks', [
  'קניות לשבת',
  'ניקיון ושטיפת רצפה',
  'עריכת שולחן השבת',
])

export const checklistStore = createCheckListStore('checklist', [
  'פלטה מחוברת',
  'מיחם מלא ודולק',
  'שעון שבת מכוון',
  'נרות ופמוטים',
  'יין לקידוש',
  'אור במקרר כבוי',
  'נייר טואלט חתוך',
  'דוד מים חמים',
  'טלפונים בצד',
  'בגדי שבת לילדים',
])

export const taskActions = actionsFor(tasksStore)
export const checklistActions = actionsFor(checklistStore)

export const useTasks = () => useStore(tasksStore)
export const useChecklist = () => useStore(checklistStore)

export const countDone = (items: CheckItem[]) => items.filter((i) => i.done).length
