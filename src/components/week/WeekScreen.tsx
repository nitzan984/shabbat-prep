import { useRef, useState } from 'react'
import { setPersonFilter, useEvents, usePersonFilter } from '../../hooks/useEvents'
import { useNow } from '../../hooks/useNow'
import { taskActions, tasksOn, useTasks } from '../../hooks/useTasks'
import { PEOPLE, type PersonFilter } from '../../lib/family'
import { expandOccurrences, forPerson, timeRange, type Occurrence } from '../../lib/occurrences'
import {
  addDays,
  formatDayMonth,
  formatGregorianLong,
  formatShortDate,
  formatWeekday,
  HEBREW_DAY_LETTERS,
  israelDay,
  weekStartOf,
  type IsoDate,
} from '../../lib/time'
import type { Task } from '../../services/shared'
import { SharedBoundary } from '../FamilyGate'
import { Icon } from '../ui/Icon'
import { PersonTag } from '../ui/PersonSelect'
import { ItemList } from '../widgets/ItemList'
import { EventDialog, type EventEditing } from './EventDialog'

const WEEKS_BACK = 5
const WEEKS_AHEAD = 5
const AGENDA_DAYS = 30

/** מסך השבוע: ראשון עד שישי, חוגים ואירועים, משימות, וחודש קדימה. */
export function WeekScreen() {
  const tasksQuery = useTasks()
  const eventsQuery = useEvents()
  // שתי הרשימות משותפות; מציגים את השער/הטעינה פעם אחת
  const combined = {
    ...eventsQuery,
    data: tasksQuery.data && eventsQuery.data ? { tasks: tasksQuery.data, events: eventsQuery.data } : undefined,
    status: tasksQuery.status === 'error' ? tasksQuery.status : eventsQuery.status,
    refetch: () => {
      tasksQuery.refetch()
      eventsQuery.refetch()
    },
  }
  return (
    <SharedBoundary query={combined} errorText="לא הצלחנו לטעון את השבוע.">
      {({ tasks, events }) => <Week tasks={tasks} events={events} />}
    </SharedBoundary>
  )
}

function Week({ tasks, events }: { tasks: Task[]; events: Parameters<typeof expandOccurrences>[0] }) {
  const now = useNow(60_000)
  const { iso: today, weekday } = israelDay(now)
  const thisWeek = weekStartOf(today)
  const filter = usePersonFilter()
  // מצב ניווט מקומי: איזה שבוע ואיזה יום פתוחים
  const [weekOffset, setWeekOffset] = useState(0)
  const [selected, setSelected] = useState<IsoDate>(() => (weekday === 6 ? addDays(today, 1) : today))
  const [editing, setEditing] = useState<EventEditing | null>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const weekStart = addDays(thisWeek, weekOffset * 7)
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))
  const day = days.includes(selected) ? selected : days.includes(today) ? today : days[0]

  const weekOccurrences = forPerson(expandOccurrences(events, days[0], days[5]), filter)
  const agenda = forPerson(expandOccurrences(events, today, addDays(today, AGENDA_DAYS)), filter)
  const visibleTasks = (date: IsoDate) =>
    tasksOn(tasks, date).filter((t) => filter === 'all' || t.assignee === filter)

  const moveWeek = (delta: number) => {
    const next = Math.min(WEEKS_AHEAD, Math.max(-WEEKS_BACK, weekOffset + delta))
    setWeekOffset(next)
    setSelected(next === 0 ? today : addDays(thisWeek, next * 7))
  }

  const open = (value: EventEditing) => {
    setEditing(value)
    dialogRef.current?.showModal()
  }
  const openOccurrence = (o: Occurrence) =>
    open({ mode: 'edit', event: o.event, occurrence: o.event.repeat === 'weekly' ? { date: o.date, skipped: o.skipped } : null })

  const dayOccurrences = weekOccurrences.filter((o) => o.date === day)
  const dayTasks = visibleTasks(day)
  const weekLabel =
    weekOffset === 0 ? 'השבוע' : weekOffset === 1 ? 'שבוע הבא' : weekOffset === -1 ? 'שבוע שעבר' : `${formatShortDate(days[0])}–${formatShortDate(days[5])}`

  return (
    <div className="week">
      <div className="person-filter" role="group" aria-label="של מי">
        {(['all', ...PEOPLE.map((p) => p.id)] as PersonFilter[]).map((id) => (
          <button
            key={id}
            type="button"
            className={`person-chip person-chip--${id}`}
            aria-pressed={filter === id}
            onClick={() => setPersonFilter(id)}
          >
            {id === 'all' ? 'כולם' : PEOPLE.find((p) => p.id === id)?.name}
          </button>
        ))}
      </div>

      <section className="week-card" aria-labelledby="week-title">
        <div className="week-nav">
          <button
            type="button"
            className="icon-btn"
            aria-label="השבוע הקודם"
            disabled={weekOffset <= -WEEKS_BACK}
            onClick={() => moveWeek(-1)}
          >
            <Icon name="chevronRight" />
          </button>
          <h2 id="week-title" className="week-nav__title">
            {weekLabel}
            <span className="week-nav__range">
              {formatDayMonth(days[0])} – {formatDayMonth(days[5])}
            </span>
          </h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="השבוע הבא"
            disabled={weekOffset >= WEEKS_AHEAD}
            onClick={() => moveWeek(1)}
          >
            <Icon name="chevronLeft" />
          </button>
        </div>

        <div className="day-strip" role="group" aria-label="בחירת יום">
          {days.map((d, i) => {
            const count = weekOccurrences.filter((o) => o.date === d && !o.skipped).length
            const openTasks = visibleTasks(d).filter((t) => !t.done).length
            return (
              <button
                key={d}
                type="button"
                className={`day-btn${d === today ? ' day-btn--today' : ''}`}
                aria-pressed={d === day}
                aria-label={`${formatWeekday(d)} ${formatDayMonth(d)}${d === today ? ', היום' : ''}${count ? `, ${count} אירועים` : ''}${openTasks ? `, ${openTasks} משימות` : ''}`}
                onClick={() => setSelected(d)}
              >
                <span className="day-btn__letter" aria-hidden="true">
                  {HEBREW_DAY_LETTERS[i]}
                </span>
                <span className="day-btn__num" aria-hidden="true">
                  {Number(d.slice(8))}
                </span>
                <span className="day-btn__dots" aria-hidden="true">
                  {count > 0 && <span className="dot dot--event" />}
                  {openTasks > 0 && <span className="dot dot--task" />}
                </span>
              </button>
            )
          })}
        </div>
        {weekOffset !== 0 && (
          <button type="button" className="btn btn--ghost btn--small week-today" onClick={() => moveWeek(-weekOffset)}>
            חזרה להשבוע
          </button>
        )}
      </section>

      <div className="week-columns">
        <section className="week-card day-panel" aria-labelledby="day-title">
          <h2 id="day-title" className="day-panel__title">
            {day === today ? 'היום · ' : ''}
            {formatGregorianLong(day).replace(/ \d{4}$/, '')}
          </h2>

          <div className="day-panel__section">
            <div className="section-head">
              <h3>חוגים ואירועים</h3>
              <button
                type="button"
                className="btn btn--soft btn--small"
                onClick={() => open({ mode: 'new', date: day, person: filter === 'all' ? null : filter })}
              >
                <Icon name="plus" size={18} />
                הוספה
              </button>
            </div>
            {dayOccurrences.length === 0 ? (
              <p className="muted day-panel__empty">אין חוגים או אירועים ביום הזה.</p>
            ) : (
              <ul className="occurrences">
                {dayOccurrences.map((o) => (
                  <li key={`${o.event.id}-${o.date}`}>
                    <OccurrenceRow occurrence={o} onOpen={() => openOccurrence(o)} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="day-panel__section widget--tasks">
            <div className="section-head">
              <h3>משימות</h3>
            </div>
            <ItemList
              key={`${day}-${filter}`}
              idPrefix={`wt-${day}`}
              items={dayTasks}
              inputLabel={`משימה ל${formatWeekday(day)}`}
              placeholder="משימה חדשה"
              emptyText={filter === 'all' ? 'אין משימות ליום הזה.' : 'אין משימות שלו או שלה ביום הזה.'}
              onAdd={(text, who) => taskActions.add('weekday', text, who, day)}
              onToggle={taskActions.toggle}
              onRemove={taskActions.remove}
              onAssign={taskActions.assign}
              defaultAssignee={filter === 'all' ? null : filter}
              compact
            />
          </div>
        </section>

        <section className="week-card agenda" id="month-agenda" aria-labelledby="agenda-title">
          <div className="section-head">
            <h2 id="agenda-title" className="day-panel__title">
              חודש קדימה
            </h2>
            <button
              type="button"
              className="btn btn--soft btn--small"
              onClick={() => open({ mode: 'new', date: day, person: filter === 'all' ? null : filter })}
            >
              <Icon name="plus" size={18} />
              חוג או אירוע
            </button>
          </div>
          {agenda.length === 0 ? (
            <p className="muted day-panel__empty">אין חוגים או אירועים ב־30 הימים הקרובים.</p>
          ) : (
            <AgendaList occurrences={agenda} today={today} onOpen={openOccurrence} />
          )}
        </section>
      </div>

      <EventDialog ref={dialogRef} editing={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function OccurrenceRow({ occurrence, onOpen }: { occurrence: Occurrence; onOpen: () => void }) {
  const { event, skipped } = occurrence
  const time = timeRange(event)
  return (
    <button type="button" className={`occurrence${skipped ? ' occurrence--skipped' : ''}`} onClick={onOpen}>
      <span className="occurrence__time" dir="ltr">
        {time ?? 'כל היום'}
      </span>
      <span className="occurrence__main">
        <span className="occurrence__title">
          {event.kind === 'class' && <Icon name="reset" size={16} className="occurrence__repeat" />}
          {event.title}
          {skipped && <span className="occurrence__cancelled"> · בוטל</span>}
        </span>
        {event.notes && <span className="occurrence__notes">{event.notes}</span>}
      </span>
      <PersonTag person={event.person} familyLabel="כל המשפחה" />
      <span className="sr-only">{event.kind === 'class' ? '(חוג שבועי)' : '(אירוע)'}, לעריכה</span>
    </button>
  )
}

function AgendaList({ occurrences, today, onOpen }: { occurrences: Occurrence[]; today: IsoDate; onOpen: (o: Occurrence) => void }) {
  const byDate = new Map<IsoDate, Occurrence[]>()
  occurrences.forEach((o) => byDate.set(o.date, [...(byDate.get(o.date) ?? []), o]))
  return (
    <ol className="agenda__days">
      {[...byDate].map(([date, items]) => (
        <li key={date} className="agenda__day">
          <h3 className="agenda__date">
            {date === today ? 'היום' : date === addDays(today, 1) ? 'מחר' : formatWeekday(date)}
            <span className="agenda__date-num">{formatDayMonth(date)}</span>
          </h3>
          <ul className="occurrences">
            {items.map((o) => (
              <li key={`${o.event.id}-${o.date}`}>
                <OccurrenceRow occurrence={o} onOpen={() => onOpen(o)} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

