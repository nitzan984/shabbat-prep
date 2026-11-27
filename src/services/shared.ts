import { isPersonId, type PersonId } from '../lib/family'
import { addDays, israelDay, type IsoDate } from '../lib/time'
import { dbRpc, type Row } from './db'

/**
 * מיפוי בין שורות המסד (snake_case) למודל של האפליקציה, לכל טבלה משותפת.
 * hooks/useCollection משתמש בתיאורים האלה כדי לקרוא ולכתוב.
 */
export interface TableSpec<T extends Row, R extends Row> {
  table: string
  /** query string של PostgREST לקריאה (select, סינון, מיון). פונקציה כי חלק תלויים בתאריך. */
  query: () => string
  fromRow: (row: R) => T
  toRow: (item: Partial<T>) => Partial<R>
}

/** מסיר שדות undefined כדי ש־PATCH לא ידרוס עמודות שלא נשלחו */
const defined = <T extends object>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>

const person = (v: unknown): PersonId | null => (isPersonId(v) ? v : null)

// ---------- קוד משפחה ----------

/** שם הבית אם הקוד נכון, אחרת null */
export const verifyFamilyCode = (code: string, signal?: AbortSignal) =>
  dbRpc<string | null>('family_name', {}, { code, signal })

// ---------- משימות ----------

export type TaskList = 'shabbat' | 'weekday'

export interface Task extends Row {
  list: TaskList
  text: string
  done: boolean
  assignee: PersonId | null
  /** רק למשימות השבוע */
  dueDate: IsoDate | null
  position: number
}

interface TaskRow extends Row {
  list: TaskList
  text: string
  done: boolean
  assignee: string | null
  due_date: string | null
  position: number
}

/** כמה זמן אחורה טוענים משימות שבוע (לניווט לשבועות קודמים) */
const TASK_HISTORY_DAYS = 42

export const tasksSpec: TableSpec<Task, TaskRow> = {
  table: 'tasks',
  query: () => {
    const from = addDays(israelDay(Date.now()).iso, -TASK_HISTORY_DAYS)
    return `select=id,list,text,done,assignee,due_date,position&or=(list.eq.shabbat,due_date.gte.${from})&order=position.asc`
  },
  fromRow: (r) => ({
    id: r.id,
    list: r.list,
    text: r.text,
    done: r.done,
    assignee: person(r.assignee),
    dueDate: r.due_date,
    position: r.position,
  }),
  toRow: (t) =>
    defined({
      id: t.id,
      list: t.list,
      text: t.text,
      done: t.done,
      assignee: t.assignee,
      due_date: t.dueDate,
      position: t.position,
    }),
}

// ---------- רשימה קבועה ----------

export interface ChecklistItem extends Row {
  text: string
  done: boolean
  position: number
}

export const checklistSpec: TableSpec<ChecklistItem, ChecklistItem> = {
  table: 'checklist_items',
  query: () => 'select=id,text,done,position&order=position.asc',
  fromRow: (r) => ({ id: r.id, text: r.text, done: r.done, position: r.position }),
  toRow: (i) => defined({ id: i.id, text: i.text, done: i.done, position: i.position }),
}

// ---------- מתכונים ----------

export type CategoryId = 'pastries' | 'mains' | 'sides' | 'salads' | 'desserts'

export interface Recipe extends Row {
  name: string
  category: CategoryId
  prepMinutes: number | null
  servings: number | null
  ingredients: string[]
  steps: string[]
  /** זמן לטיימר, למשל זמן אפייה */
  timerMinutes: number | null
  inMenu: boolean
}

interface RecipeRow extends Row {
  name: string
  category: CategoryId
  prep_minutes: number | null
  servings: number | null
  timer_minutes: number | null
  ingredients: string[]
  steps: string[]
  in_menu: boolean
}

export const recipesSpec: TableSpec<Recipe, RecipeRow> = {
  table: 'recipes',
  query: () =>
    'select=id,name,category,prep_minutes,servings,timer_minutes,ingredients,steps,in_menu&order=created_at.asc',
  fromRow: (r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    prepMinutes: r.prep_minutes,
    servings: r.servings,
    timerMinutes: r.timer_minutes,
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? [],
    inMenu: r.in_menu,
  }),
  toRow: (r) =>
    defined({
      id: r.id,
      name: r.name,
      category: r.category,
      prep_minutes: r.prepMinutes,
      servings: r.servings,
      timer_minutes: r.timerMinutes,
      ingredients: r.ingredients,
      steps: r.steps,
      in_menu: r.inMenu,
    }),
}

// ---------- חוגים ואירועים ----------

export type EventKind = 'class' | 'event'

export interface CalendarEvent extends Row {
  title: string
  /** null = כל המשפחה */
  person: PersonId | null
  kind: EventKind
  /** לאירוע: התאריך. לחוג: המפגש הראשון, וממנו היום בשבוע */
  date: IsoDate
  /** "16:00" */
  startTime: string | null
  endTime: string | null
  repeat: 'none' | 'weekly'
  repeatUntil: IsoDate | null
  /** מפגשים שבוטלו */
  skipDates: IsoDate[]
  notes: string | null
}

interface EventRow extends Row {
  title: string
  person: string | null
  kind: EventKind
  date: string
  start_time: string | null
  end_time: string | null
  repeat: 'none' | 'weekly'
  repeat_until: string | null
  skip_dates: string[] | null
  notes: string | null
}

/** "16:00:00" → "16:00" */
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : null)

export const eventsSpec: TableSpec<CalendarEvent, EventRow> = {
  table: 'events',
  query: () => {
    const from = addDays(israelDay(Date.now()).iso, -TASK_HISTORY_DAYS)
    return `select=id,title,person,kind,date,start_time,end_time,repeat,repeat_until,skip_dates,notes&or=(date.gte.${from},repeat.eq.weekly)&order=date.asc`
  },
  fromRow: (r) => ({
    id: r.id,
    title: r.title,
    person: person(r.person),
    kind: r.kind,
    date: r.date,
    startTime: hhmm(r.start_time),
    endTime: hhmm(r.end_time),
    repeat: r.repeat,
    repeatUntil: r.repeat_until,
    skipDates: r.skip_dates ?? [],
    notes: r.notes,
  }),
  toRow: (e) =>
    defined({
      id: e.id,
      title: e.title,
      person: e.person,
      kind: e.kind,
      date: e.date,
      start_time: e.startTime,
      end_time: e.endTime,
      repeat: e.repeat,
      repeat_until: e.repeatUntil,
      skip_dates: e.skipDates,
      notes: e.notes,
    }),
}
