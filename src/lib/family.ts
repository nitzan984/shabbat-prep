/** בני המשפחה שאפשר לשייך אליהם משימות, חוגים ואירועים. */
export const PEOPLE = [
  { id: 'shir', name: 'שיר' },
  { id: 'michal', name: 'מיכל' },
  { id: 'eitan', name: 'איתן' },
] as const

export type PersonId = (typeof PEOPLE)[number]['id']

export const isPersonId = (v: unknown): v is PersonId => PEOPLE.some((p) => p.id === v)

export const personName = (id: PersonId | null, fallback = 'בלי שיוך') =>
  id ? (PEOPLE.find((p) => p.id === id)?.name ?? fallback) : fallback

/** סינון לפי אדם: הכל או אדם אחד. */
export type PersonFilter = 'all' | PersonId
