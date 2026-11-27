/**
 * בדיקה מול Supabase האמיתי, על "משפחת בדיקה" נפרדת. מורצת רק עם `pnpm test:live`.
 */
import { describe, expect, it } from 'vitest'
import { dbDelete, dbInsert, dbSelect, dbUpdate } from './db'
import { tasksSpec, verifyFamilyCode } from './shared'

const code = process.env.TEST_FAMILY_CODE ?? ''
const live = process.env.LIVE && code ? describe : describe.skip
const signal = () => AbortSignal.timeout(20_000)

live('Supabase, family code access', () => {
  it('accepts the test code and rejects a wrong one', async () => {
    expect(await verifyFamilyCode(code, signal())).toBe('משפחת בדיקה')
    expect(await verifyFamilyCode('wrong-code-0000', signal())).toBeNull()
  })

  it('round-trips a task with an assignee, invisible to other codes', async () => {
    const id = crypto.randomUUID()
    const row = tasksSpec.toRow({ id, list: 'weekday', text: 'בדיקה', done: false, assignee: 'michal', dueDate: '2026-11-29', position: 1 })
    await dbInsert('tasks', row, { code, signal: signal() })
    try {
      const mine = await dbSelect<Parameters<typeof tasksSpec.fromRow>[0]>('tasks', `id=eq.${id}&select=*`, { code, signal: signal() })
      expect(mine.map(tasksSpec.fromRow)[0]).toMatchObject({ id, assignee: 'michal', dueDate: '2026-11-29', done: false })

      await dbUpdate('tasks', `id=eq.${id}`, { done: true }, { code, signal: signal() })
      const [after] = await dbSelect<{ done: boolean }>('tasks', `id=eq.${id}&select=done`, { code, signal: signal() })
      expect(after.done).toBe(true)

      const stranger = await dbSelect('tasks', `id=eq.${id}&select=id`, { code: 'wrong-code-0000', signal: signal() })
      expect(stranger).toEqual([])
      await expect(dbInsert('tasks', { list: 'shabbat', text: 'x' }, { code: 'wrong-code-0000', signal: signal() })).rejects.toThrow(/401/)
    } finally {
      await dbDelete('tasks', `id=eq.${id}`, { code, signal: signal() })
    }
  })

  it('rejects a weekday task without a date', async () => {
    await expect(
      dbInsert('tasks', { list: 'weekday', text: 'בלי תאריך' }, { code, signal: signal() }),
    ).rejects.toThrow(/400/)
  })
})
