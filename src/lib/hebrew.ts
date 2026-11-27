/** מסיר ניקוד וטעמים (U+0591–U+05C7). גרש (U+05F3) וגרשיים (U+05F4) נשארים. */
export const stripNiqqud = (text: string) => text.replace(/[\u0591-\u05C7]/g, '')

const BOOKS: Record<string, string> = {
  Genesis: 'בראשית',
  Exodus: 'שמות',
  Leviticus: 'ויקרא',
  Numbers: 'במדבר',
  Deuteronomy: 'דברים',
  Joshua: 'יהושע',
  Judges: 'שופטים',
  'I Samuel': 'שמואל א׳',
  'II Samuel': 'שמואל ב׳',
  'I Kings': 'מלכים א׳',
  'II Kings': 'מלכים ב׳',
  Isaiah: 'ישעיהו',
  Jeremiah: 'ירמיהו',
  Ezekiel: 'יחזקאל',
  Hosea: 'הושע',
  Joel: 'יואל',
  Amos: 'עמוס',
  Obadiah: 'עובדיה',
  Jonah: 'יונה',
  Micah: 'מיכה',
  Nahum: 'נחום',
  Habakkuk: 'חבקוק',
  Zephaniah: 'צפניה',
  Haggai: 'חגי',
  Zechariah: 'זכריה',
  Malachi: 'מלאכי',
  Psalms: 'תהלים',
  Proverbs: 'משלי',
  Job: 'איוב',
  'Song of Songs': 'שיר השירים',
  Ruth: 'רות',
  Lamentations: 'איכה',
  Ecclesiastes: 'קהלת',
  Esther: 'אסתר',
  Daniel: 'דניאל',
  Ezra: 'עזרא',
  Nehemiah: 'נחמיה',
  'I Chronicles': 'דברי הימים א׳',
  'II Chronicles': 'דברי הימים ב׳',
}

export interface Reading {
  /** שם הספר בעברית */
  book: string
  /** פרקים ופסוקים, למשל "32:4-36:43" */
  ref: string
}

/**
 * "Genesis 37:1-40:23; Numbers 7:1-17" → [{בראשית, 37:1-40:23}, {במדבר, 7:1-17}]
 * מה שאחרי "|" (למשל "Shabbat Shekalim") הוא הערה באנגלית ולא נכלל.
 */
export function parseReadings(raw: string | undefined): Reading[] {
  if (!raw) return []
  const main = raw.split('|')[0]
  return main
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = /^(.*?)\s+(\d[\d:\-,\s]*)$/.exec(part)
      if (!match) return { book: BOOKS[part] ?? part, ref: '' }
      const [, book, ref] = match
      return { book: BOOKS[book] ?? book, ref: ref.trim() }
    })
}
