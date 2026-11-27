import { createPersistentStore, useStore } from '../lib/store'

export const WIDGET_IDS = ['timer', 'tasks', 'checklist', 'recipes'] as const
export type WidgetId = (typeof WIDGET_IDS)[number]

interface LayoutState {
  order: WidgetId[]
  hidden: WidgetId[]
}

const isWidgetId = (v: unknown): v is WidgetId => WIDGET_IDS.includes(v as WidgetId)

/** מקבל רק מצב תקין, ומוסיף בסוף ווידג'טים חדשים שלא היו בגרסה השמורה. */
function revive(raw: unknown): LayoutState | undefined {
  const r = raw as LayoutState
  if (typeof r !== 'object' || r === null || !Array.isArray(r.order) || !Array.isArray(r.hidden)) {
    return undefined
  }
  const order = [...new Set(r.order.filter(isWidgetId))]
  WIDGET_IDS.forEach((id) => {
    if (!order.includes(id)) order.push(id)
  })
  return { order, hidden: [...new Set(r.hidden.filter(isWidgetId))] }
}

const layoutStore = createPersistentStore<LayoutState>(
  'layout',
  () => ({ order: [...WIDGET_IDS], hidden: [] }),
  revive,
)

export const layoutActions = {
  toggle: (id: WidgetId) =>
    layoutStore.set((s) => ({
      ...s,
      hidden: s.hidden.includes(id) ? s.hidden.filter((h) => h !== id) : [...s.hidden, id],
    })),
  show: (id: WidgetId) =>
    layoutStore.set((s) => (s.hidden.includes(id) ? { ...s, hidden: s.hidden.filter((h) => h !== id) } : s)),
  /** הזזה צעד אחד בין הווידג'טים הגלויים (dir = -1 קודם, 1 הבא). */
  step(id: WidgetId, dir: -1 | 1) {
    layoutStore.set((s) => {
      const visible = s.order.filter((w) => !s.hidden.includes(w))
      const neighbor = visible[visible.indexOf(id) + dir]
      if (!neighbor) return s
      const order = [...s.order]
      const a = order.indexOf(id)
      const b = order.indexOf(neighbor)
      ;[order[a], order[b]] = [order[b], order[a]]
      return { ...s, order }
    })
  },
  /** גרירה: מעביר את id למקום של target. */
  moveTo(id: WidgetId, target: WidgetId) {
    if (id === target) return
    layoutStore.set((s) => {
      const order = s.order.filter((w) => w !== id)
      const targetIndex = s.order.indexOf(target)
      const fromIndex = s.order.indexOf(id)
      // גרירה קדימה: נכנסים אחרי היעד. גרירה אחורה: לפניו.
      const insertAt = order.indexOf(target) + (fromIndex < targetIndex ? 1 : 0)
      order.splice(insertAt, 0, id)
      return { ...s, order }
    })
  },
}

export const useLayout = () => useStore(layoutStore)
