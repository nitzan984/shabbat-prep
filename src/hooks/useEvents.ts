import { isPersonId, type PersonFilter } from '../lib/family'
import { createPersistentStore, newId, useStore } from '../lib/store'
import type { IsoDate } from '../lib/time'
import { eventsSpec, type CalendarEvent } from '../services/shared'
import { createCollection } from './useCollection'

const events = createCollection('events', eventsSpec)

export function useEvents() {
  const query = events.use()
  return { ...query, events: query.data ?? [] }
}

export type EventDraft = Omit<CalendarEvent, 'id' | 'skipDates'>

export const eventActions = {
  add: (draft: EventDraft) => events.insert({ ...draft, id: newId(), skipDates: [] }),
  update: (id: string, draft: EventDraft) => events.patch(id, draft),
  remove: (id: string) => events.remove(id),
  /** ביטול מפגש אחד של חוג, או החזרה שלו */
  setSkipped: (event: CalendarEvent, date: IsoDate, skipped: boolean) =>
    events.patch(event.id, {
      skipDates: skipped
        ? [...new Set([...event.skipDates, date])]
        : event.skipDates.filter((d) => d !== date),
    }),
}

/** "של מי" במסך השבוע: העדפה של המכשיר, לא משותפת */
const filterStore = createPersistentStore<PersonFilter>(
  'person-filter',
  () => 'all',
  (raw) => (raw === 'all' || isPersonId(raw) ? raw : undefined),
)

export const setPersonFilter = (filter: PersonFilter) => filterStore.set(filter)
export const usePersonFilter = () => useStore(filterStore)
