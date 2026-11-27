import { useState, type FormEvent, type Ref } from 'react'
import { eventActions, type EventDraft } from '../../hooks/useEvents'
import { showToast } from '../../hooks/useNotices'
import type { PersonId } from '../../lib/family'
import { formatShortDate, type IsoDate } from '../../lib/time'
import type { CalendarEvent, EventKind } from '../../services/shared'
import { Icon } from '../ui/Icon'
import { PersonSelect } from '../ui/PersonSelect'

export type EventEditing =
  | { mode: 'new'; date: IsoDate; person: PersonId | null }
  | { mode: 'edit'; event: CalendarEvent; occurrence: { date: IsoDate; skipped: boolean } | null }

/**
 * הוספה ועריכה של חוג או אירוע, בתוך <dialog>.
 * ההורה מרכיב את התוכן מחדש (key) לכל פתיחה, אז אין state לסנכרן.
 */
export function EventDialog({
  ref,
  editing,
  onClose,
}: {
  ref: Ref<HTMLDialogElement>
  editing: EventEditing | null
  onClose: () => void
}) {
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="event-title" onClose={onClose} closedby="any">
      {editing && <EventForm key={editing.mode === 'edit' ? editing.event.id : editing.date} editing={editing} onDone={onClose} />}
    </dialog>
  )
}

function EventForm({ editing, onDone }: { editing: EventEditing; onDone: () => void }) {
  const existing = editing.mode === 'edit' ? editing.event : null
  // סוג ואדם משנים את הטופס עצמו, לכן הם state מקומי; שאר השדות נקראים ב־submit
  const [kind, setKind] = useState<EventKind>(existing?.kind ?? 'event')
  const [person, setPerson] = useState<PersonId | null>(existing ? existing.person : editing.mode === 'new' ? editing.person : null)
  const [error, setError] = useState('')

  const close = (event?: { currentTarget: HTMLElement }) => {
    ;(event?.currentTarget.closest('dialog') ?? document.querySelector<HTMLDialogElement>('dialog[open]'))?.close()
    onDone()
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = (name: string) => String(form.get(name) ?? '').trim()
    const title = text('title')
    const date = text('date')
    const startTime = text('startTime') || null
    const endTime = text('endTime') || null
    const repeatUntil = kind === 'class' ? text('repeatUntil') || null : null
    if (!title || !date) return
    if (startTime && endTime && endTime <= startTime) return setError('שעת הסיום צריכה להיות אחרי שעת ההתחלה.')
    if (repeatUntil && repeatUntil < date) return setError('תאריך הסיום של החוג לפני המפגש הראשון.')

    const draft: EventDraft = {
      title,
      person,
      kind,
      date,
      startTime,
      endTime,
      repeat: kind === 'class' ? 'weekly' : 'none',
      repeatUntil,
      notes: text('notes') || null,
    }
    if (existing) void eventActions.update(existing.id, draft)
    else void eventActions.add(draft)
    showToast(existing ? 'נשמר' : kind === 'class' ? 'החוג נוסף' : 'האירוע נוסף')
    close(event)
  }

  const remove = (event: { currentTarget: HTMLElement }) => {
    if (!existing) return
    const what = existing.kind === 'class' ? 'את החוג וכל המפגשים שלו' : 'את האירוע'
    if (!window.confirm(`למחוק ${what}?`)) return
    void eventActions.remove(existing.id)
    showToast('נמחק')
    close(event)
  }

  const toggleSkip = (event: { currentTarget: HTMLElement }) => {
    if (!existing || editing.mode !== 'edit' || !editing.occurrence) return
    const { date, skipped } = editing.occurrence
    void eventActions.setSkipped(existing, date, !skipped)
    showToast(skipped ? 'המפגש חזר' : `המפגש ב־${formatShortDate(date)} בוטל`)
    close(event)
  }

  const occurrence = editing.mode === 'edit' ? editing.occurrence : null

  return (
    <form className="event-form" onSubmit={submit}>
      <div className="sheet__head">
        <h2 id="event-title" className="sheet__title">
          {existing ? `עריכת ${existing.kind === 'class' ? 'חוג' : 'אירוע'}` : 'חוג או אירוע חדש'}
        </h2>
        <button type="button" className="icon-btn" aria-label="סגירה" onClick={close}>
          <Icon name="close" />
        </button>
      </div>

      <div className="event-form__body">
        <fieldset className="segmented">
          <legend className="sr-only">סוג</legend>
          <label className="segmented__option">
            <input type="radio" name="kind" value="event" checked={kind === 'event'} onChange={() => setKind('event')} />
            <span>אירוע חד־פעמי</span>
          </label>
          <label className="segmented__option">
            <input type="radio" name="kind" value="class" checked={kind === 'class'} onChange={() => setKind('class')} />
            <span>חוג כל שבוע</span>
          </label>
        </fieldset>

        <div className="field">
          <label htmlFor="ev-title">{kind === 'class' ? 'שם החוג' : 'מה קורה?'}</label>
          <input
            id="ev-title"
            name="title"
            className="input"
            required
            maxLength={120}
            defaultValue={existing?.title}
            placeholder={kind === 'class' ? 'למשל: חוג ציור' : 'למשל: יום הולדת לסבתא'}
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label htmlFor="ev-person">למי</label>
          <PersonSelect id="ev-person" label="למי" value={person} onChange={setPerson} emptyLabel="כל המשפחה" className="person-select--full" />
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor="ev-date">{kind === 'class' ? 'מפגש ראשון' : 'תאריך'}</label>
            <input
              id="ev-date"
              name="date"
              type="date"
              className="input"
              required
              defaultValue={existing?.date ?? (editing.mode === 'new' ? editing.date : undefined)}
            />
          </div>
          {kind === 'class' && (
            <div className="field">
              <label htmlFor="ev-until">עד תאריך (לא חובה)</label>
              <input id="ev-until" name="repeatUntil" type="date" className="input" defaultValue={existing?.repeatUntil ?? ''} />
            </div>
          )}
          <div className="field">
            <label htmlFor="ev-start">משעה</label>
            <input id="ev-start" name="startTime" type="time" className="input" defaultValue={existing?.startTime ?? ''} />
          </div>
          <div className="field">
            <label htmlFor="ev-end">עד שעה</label>
            <input id="ev-end" name="endTime" type="time" className="input" defaultValue={existing?.endTime ?? ''} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="ev-notes">הערות (לא חובה)</label>
          <textarea id="ev-notes" name="notes" rows={2} maxLength={500} className="input" defaultValue={existing?.notes ?? ''} />
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="event-form__actions">
          <button type="submit" className="btn btn--primary btn--wide">
            <Icon name="check" size={20} />
            שמירה
          </button>
          {existing && occurrence && existing.kind === 'class' && (
            <button type="button" className="btn btn--soft" onClick={toggleSkip}>
              <Icon name={occurrence.skipped ? 'reset' : 'close'} size={20} />
              {occurrence.skipped
                ? `החזרת המפגש ב־${formatShortDate(occurrence.date)}`
                : `ביטול המפגש ב־${formatShortDate(occurrence.date)} בלבד`}
            </button>
          )}
          {existing && (
            <button type="button" className="btn btn--danger" onClick={remove}>
              <Icon name="trash" size={20} />
              {existing.kind === 'class' ? 'מחיקת החוג' : 'מחיקה'}
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
