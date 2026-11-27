import { defineQuery, getQueryData, mutate, useQuery } from '../lib/query'
import { dbDelete, dbInsert, dbSelect, dbUpdate, type Row } from '../services/db'
import type { TableSpec } from '../services/shared'
import { getFamilyCode, useFamily } from './useFamily'
import { showToast } from './useNotices'

const SYNC_MS = 10_000

const FAILED = 'השינוי לא נשמר. בדקו שיש אינטרנט ונסו שוב.'

/**
 * רשימה משותפת אחת (משימות, רשימה קבועה, מתכונים, אירועים):
 * server state לפי קוד המשפחה, עם פעולות אופטימיות.
 */
export function createCollection<T extends Row, R extends Row>(name: string, spec: TableSpec<T, R>) {
  const query = defineQuery<string, T[]>({
    name,
    fetch: async (code, signal) => {
      const rows = await dbSelect<R>(spec.table, spec.query(), { code, signal })
      return rows.map(spec.fromRow)
    },
    staleTime: SYNC_MS,
    refetchInterval: SYNC_MS,
    persist: { keep: 1 },
  })

  async function run(optimistic: (items: T[]) => T[], request: (code: string) => Promise<unknown>) {
    const code = getFamilyCode()
    if (!code) return false
    const ok = await mutate(query, code, optimistic, () => request(code))
    if (!ok) showToast(FAILED)
    return ok
  }

  return {
    use() {
      const { code } = useFamily()
      return { ...useQuery(query, code ?? '', { enabled: code !== null }), connected: code !== null }
    },
    /** הנתונים במטמון כרגע (לבדיקות לפני פעולה) */
    current: (): T[] => {
      const code = getFamilyCode()
      return (code && getQueryData(query, code)) || []
    },
    insert: (item: T) => run((items) => [...items, item], (code) => dbInsert(spec.table, spec.toRow(item), { code })),
    patch: (id: string, changes: Partial<T>) =>
      run(
        (items) => items.map((i) => (i.id === id ? { ...i, ...changes } : i)),
        (code) => dbUpdate(spec.table, `id=eq.${id}`, spec.toRow(changes), { code }),
      ),
    /** עדכון של כמה שורות: predicate למטמון, filter של PostgREST לשרת */
    patchWhere: (predicate: (item: T) => boolean, filter: string, changes: Partial<T>) =>
      run(
        (items) => items.map((i) => (predicate(i) ? { ...i, ...changes } : i)),
        (code) => dbUpdate(spec.table, filter, spec.toRow(changes), { code }),
      ),
    remove: (id: string) =>
      run(
        (items) => items.filter((i) => i.id !== id),
        (code) => dbDelete(spec.table, `id=eq.${id}`, { code }),
      ),
    removeWhere: (predicate: (item: T) => boolean, filter: string) =>
      run(
        (items) => items.filter((i) => !predicate(i)),
        (code) => dbDelete(spec.table, filter, { code }),
      ),
  }
}
