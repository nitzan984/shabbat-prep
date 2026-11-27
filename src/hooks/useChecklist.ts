import { newId } from '../lib/store'
import { checklistSpec, type ChecklistItem } from '../services/shared'
import { createCollection } from './useCollection'

const checklist = createCollection('checklist', checklistSpec)

export function useChecklist() {
  const query = checklist.use()
  return { ...query, items: query.data ?? [] }
}

export const checklistActions = {
  add(text: string) {
    const clean = text.trim()
    if (!clean) return false
    void checklist.insert({ id: newId(), text: clean, done: false, position: Date.now() / 1000 })
    return true
  },
  toggle: (item: ChecklistItem) => checklist.patch(item.id, { done: !item.done }),
  remove: (item: ChecklistItem) => checklist.remove(item.id),
  /** איפוס לשבת הבאה: מבטל את כל הסימונים */
  uncheckAll: () => checklist.patchWhere((i) => i.done, 'done=eq.true', { done: false }),
}

export const countDone = (items: { done: boolean }[]) => items.filter((i) => i.done).length
