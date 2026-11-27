import { createPersistentStore, useStore } from '../lib/store'
import { isDbConfigured } from '../services/db'
import { verifyFamilyCode } from '../services/shared'
import { showToast } from './useNotices'

/**
 * קוד המשפחה של המכשיר הזה. נשמר מקומית אחרי שהשרת אישר אותו,
 * ונשלח בכל בקשה לנתונים המשותפים.
 */

interface FamilyState {
  code: string | null
  name: string | null
}

const familyStore = createPersistentStore<FamilyState>(
  'family',
  () => ({ code: null, name: null }),
  (raw) => {
    const r = raw as FamilyState
    return typeof r === 'object' && r !== null && (typeof r.code === 'string' || r.code === null)
      ? { code: r.code, name: typeof r.name === 'string' ? r.name : null }
      : undefined
  },
)

export const getFamilyCode = () => familyStore.get().code

const normalize = (code: string) => code.trim().toLowerCase().replace(/\s+/g, '')

export type JoinResult = 'ok' | 'invalid' | 'error'

export async function joinFamily(rawCode: string): Promise<JoinResult> {
  const code = normalize(rawCode)
  if (!code || !isDbConfigured()) return 'invalid'
  try {
    const name = await verifyFamilyCode(code, AbortSignal.timeout(15_000))
    if (!name) return 'invalid'
    familyStore.set({ code, name })
    return 'ok'
  } catch {
    return 'error'
  }
}

export const leaveFamily = () => familyStore.set({ code: null, name: null })

export const inviteLink = (code: string) => `${location.origin}/#code=${encodeURIComponent(code)}`

/**
 * קישור הזמנה (`/#code=...`): מצטרפים ומוחקים את הקוד מהכתובת,
 * כדי שלא יישאר בהיסטוריה או ישותף בטעות הלאה.
 */
export function consumeInviteLink() {
  const match = /(?:^#|&)code=([^&]+)/.exec(location.hash)
  if (!match) return
  const code = decodeURIComponent(match[1])
  history.replaceState(null, '', location.pathname + location.search)
  void joinFamily(code).then((result) => {
    if (result === 'ok') showToast('התחברתם לרשימות של המשפחה')
    else if (result === 'invalid') showToast('קישור ההזמנה לא תקין')
    else showToast('אין חיבור כרגע. נסו לפתוח את הקישור שוב.')
  })
}

export const useFamily = () => useStore(familyStore)
