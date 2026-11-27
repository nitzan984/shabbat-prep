import { STORAGE_PREFIX } from '../config'

/** קריאה בטוחה מ־localStorage. מחזירה undefined אם אין ערך, אם ה־JSON פגום או אם האחסון חסום. */
export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw === null ? undefined : (JSON.parse(raw) as unknown)
  } catch {
    return undefined
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    // אחסון מלא או חסום (גלישה פרטית): ממשיכים בזיכרון בלבד.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    // אין מה לעשות
  }
}

/** המפתח המלא כפי שהוא מופיע באירוע storage של טאב אחר. */
export const fullKey = (key: string) => STORAGE_PREFIX + key
