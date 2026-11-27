import { createPersistentStore, newId, useStore } from '../lib/store'

export const CATEGORIES = [
  { id: 'pastries', label: 'מאפים' },
  { id: 'mains', label: 'עיקריות' },
  { id: 'sides', label: 'תוספות' },
  { id: 'salads', label: 'סלטים' },
  { id: 'desserts', label: 'קינוחים' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id

export interface Recipe {
  id: string
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

export type RecipeDraft = Omit<Recipe, 'id'>

const SEED: RecipeDraft[] = [
  {
    name: 'חלה מתוקה',
    category: 'pastries',
    prepMinutes: 150,
    servings: 2,
    timerMinutes: 30,
    inMenu: true,
    ingredients: [
      '1 ק״ג קמח לבן',
      '50 גרם שמרים טריים',
      '3/4 כוס סוכר',
      '2 כפיות מלח',
      '2 ביצים',
      '3/4 כוס שמן',
      '2 כוסות מים פושרים',
      'ביצה להברשה ושומשום',
    ],
    steps: [
      'מערבבים קמח, שמרים וסוכר.',
      'מוסיפים ביצים, שמן ומים ולשים כ־10 דקות.',
      'מוסיפים מלח ולשים עוד 2 דקות עד לבצק רך.',
      'מכסים ומתפיחים כשעה, עד שהנפח מוכפל.',
      'קולעים חלות ומתפיחים עוד חצי שעה.',
      'מברישים בביצה, מפזרים שומשום ואופים ב־180 מעלות כ־30 דקות.',
    ],
  },
  {
    name: 'חמין ספרדי',
    category: 'mains',
    prepMinutes: 45,
    servings: 8,
    timerMinutes: null,
    inMenu: true,
    ingredients: [
      '1 ק״ג בשר בקר (שפונדרה או כתף)',
      '6 תפוחי אדמה',
      '1 כוס חומוס מושרה',
      '1 כוס חיטה מושרה',
      '8 ביצים בקליפה',
      '2 בצלים',
      '4 שיני שום',
      '2 כפות פפריקה מתוקה',
      '1 כפית כורכום',
      'מלח ופלפל',
    ],
    steps: [
      'מטגנים בצל קצוץ עד הזהבה, מוסיפים שום ותבלינים.',
      'מסדרים בסיר את הבשר, החומוס והחיטה.',
      'מוסיפים תפוחי אדמה חצויים וביצים שטופות.',
      'מכסים במים, מביאים לרתיחה ומתבלים.',
      'מעבירים לפלטה לפני שבת ומבשלים לאט כל הלילה.',
    ],
  },
  {
    name: 'אורז עם שקדים',
    category: 'sides',
    prepMinutes: 30,
    servings: 6,
    timerMinutes: 20,
    inMenu: false,
    ingredients: [
      '2 כוסות אורז בסמטי',
      '1/2 כוס אטריות דקות',
      '3 כוסות מים רותחים',
      '1/2 כוס שקדים פרוסים',
      '3 כפות שמן',
      '1.5 כפיות מלח',
    ],
    steps: [
      'מטגנים את האטריות בשמן עד הזהבה.',
      'מוסיפים את האורז ומערבבים דקה.',
      'מוסיפים מים רותחים ומלח, מכסים ומבשלים 20 דקות על אש נמוכה.',
      'קולים את השקדים במחבת יבשה ומפזרים מעל.',
    ],
  },
  {
    name: 'מטבוחה',
    category: 'salads',
    prepMinutes: 90,
    servings: 10,
    timerMinutes: 60,
    inMenu: true,
    ingredients: [
      '1 ק״ג עגבניות בשלות',
      '3 פלפלים אדומים קלויים',
      '6 שיני שום',
      '1 פלפל חריף',
      '1/3 כוס שמן',
      '1 כפית פפריקה',
      'מלח וסוכר לפי הטעם',
    ],
    steps: [
      'קולפים וקוצצים את העגבניות והפלפלים.',
      'מחממים שמן ומטגנים שום ופלפל חריף.',
      'מוסיפים את הירקות ומבשלים על אש נמוכה כשעה.',
      'מתבלים וממשיכים לבשל עד שהסלט סמיך.',
    ],
  },
  {
    name: 'עוגת תפוזים',
    category: 'desserts',
    prepMinutes: 15,
    servings: 12,
    timerMinutes: 45,
    inMenu: false,
    ingredients: [
      '4 ביצים',
      '1.5 כוסות סוכר',
      '1 כוס מיץ תפוזים',
      '3/4 כוס שמן',
      'גרידה מתפוז אחד',
      '2 כוסות קמח תופח',
    ],
    steps: [
      'מחממים תנור ל־170 מעלות.',
      'טורפים ביצים וסוכר.',
      'מוסיפים מיץ, שמן וגרידה.',
      'מוסיפים קמח ומערבבים לתערובת אחידה.',
      'אופים כ־45 דקות, עד שקיסם יוצא יבש.',
    ],
  },
]

const isRecipe = (v: unknown): v is Recipe => {
  const r = v as Recipe
  return (
    typeof r === 'object' &&
    r !== null &&
    typeof r.id === 'string' &&
    typeof r.name === 'string' &&
    CATEGORIES.some((c) => c.id === r.category) &&
    Array.isArray(r.ingredients) &&
    Array.isArray(r.steps) &&
    typeof r.inMenu === 'boolean'
  )
}

const recipesStore = createPersistentStore<Recipe[]>(
  'recipes',
  () => SEED.map((r) => ({ ...r, id: newId() })),
  (raw) => (Array.isArray(raw) && raw.every(isRecipe) ? raw : undefined),
)

export const recipeActions = {
  add(draft: RecipeDraft): string {
    const id = newId()
    recipesStore.set((list) => [...list, { ...draft, id }])
    return id
  },
  update: (id: string, draft: RecipeDraft) =>
    recipesStore.set((list) => list.map((r) => (r.id === id ? { ...draft, id } : r))),
  remove: (id: string) => recipesStore.set((list) => list.filter((r) => r.id !== id)),
  toggleMenu: (id: string) =>
    recipesStore.set((list) => list.map((r) => (r.id === id ? { ...r, inMenu: !r.inMenu } : r))),
}

export const useRecipes = () => useStore(recipesStore)
