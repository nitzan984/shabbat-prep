import type { PersonId } from '../lib/family'
import { newId } from '../lib/store'
import type { IsoDate } from '../lib/time'
import { tasksSpec, type Task, type TaskList } from '../services/shared'
import { createCollection } from './useCollection'

const tasks = createCollection('tasks', tasksSpec)

export function useTasks() {
  const query = tasks.use()
  return { ...query, tasks: query.data ?? [] }
}

export const shabbatTasks = (all: Task[]) => all.filter((t) => t.list === 'shabbat')

export const tasksOn = (all: Task[], date: IsoDate) =>
  all.filter((t) => t.list === 'weekday' && t.dueDate === date)

export const taskActions = {
  add(list: TaskList, text: string, assignee: PersonId | null, dueDate: IsoDate | null = null) {
    const clean = text.trim()
    if (!clean) return false
    void tasks.insert({
      id: newId(),
      list,
      text: clean,
      done: false,
      assignee,
      dueDate: list === 'weekday' ? dueDate : null,
      position: Date.now() / 1000,
    })
    return true
  },
  toggle: (task: Task) => tasks.patch(task.id, { done: !task.done }),
  assign: (task: Task, assignee: PersonId | null) => tasks.patch(task.id, { assignee }),
  remove: (task: Task) => tasks.remove(task.id),
  clearDoneShabbat: () =>
    tasks.removeWhere((t) => t.list === 'shabbat' && t.done, 'list=eq.shabbat&done=eq.true'),
  /** יש כבר משימת שבת פתוחה עם הטקסט הזה? */
  hasOpenShabbatTask: (text: string) =>
    tasks.current().some((t) => t.list === 'shabbat' && !t.done && t.text === text),
}
