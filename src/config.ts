/** מיקום קבוע: רחובות. כל ה־API מקבלים את אותן קואורדינטות. */
export const LOCATION = {
  name: 'רחובות',
  latitude: 31.8947,
  longitude: 34.8113,
  tzid: 'Asia/Jerusalem',
} as const

/** קידומת לכל מפתחות ה־localStorage של האפליקציה. */
export const STORAGE_PREFIX = 'shabbat-prep:v1:'

/** Supabase: הכתובת והמפתח הציבורי מגיעים ממשתני סביבה של Vite. */
export const SUPABASE = {
  url: import.meta.env.VITE_SUPABASE_URL ?? '',
  key: import.meta.env.VITE_SUPABASE_KEY ?? '',
} as const
