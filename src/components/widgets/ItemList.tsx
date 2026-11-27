import { useState, type FormEvent } from 'react'
import type { PersonId } from '../../lib/family'
import { Icon } from '../ui/Icon'
import { PersonSelect, PersonTag } from '../ui/PersonSelect'

export interface ListItem {
  id: string
  text: string
  done: boolean
  assignee?: PersonId | null
}

/**
 * רשימה עם הוספה (גם ב־Enter), סימון ומחיקה. משותפת למטלות, למשימות השבוע
 * ולרשימה הקבועה. כש־onAssign קיים, אפשר לשייך כל פריט לאדם.
 */
export function ItemList<T extends ListItem>({
  idPrefix,
  items,
  inputLabel,
  placeholder,
  emptyText,
  onAdd,
  onToggle,
  onRemove,
  onAssign,
  defaultAssignee = null,
  compact = false,
}: {
  idPrefix: string
  items: T[]
  inputLabel: string
  placeholder: string
  emptyText: string
  onAdd: (text: string, assignee: PersonId | null) => boolean
  onToggle: (item: T) => void
  onRemove: (item: T) => void
  onAssign?: (item: T, assignee: PersonId | null) => void
  defaultAssignee?: PersonId | null
  compact?: boolean
}) {
  const inputId = `${idPrefix}-new`
  const assignable = onAssign !== undefined
  // למי לשייך את הפריט הבא: UI מקומי (ההורה מאפס עם key כשהסינון משתנה)
  const [who, setWho] = useState<PersonId | null>(defaultAssignee)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const input = form.elements.namedItem('text') as HTMLInputElement
    if (onAdd(input.value, who)) input.value = ''
    input.focus()
  }

  const remove = (index: number) => {
    const item = items[index]
    const next = items[index + 1] ?? items[index - 1]
    onRemove(item)
    // הפוקוס עובר לפריט הסמוך, או לשדה ההוספה אם הרשימה התרוקנה
    requestAnimationFrame(() =>
      document.getElementById(next ? `${idPrefix}-check-${next.id}` : inputId)?.focus(),
    )
  }

  return (
    <div className={compact ? 'item-list item-list--compact' : 'item-list'}>
      <form className="add-row" onSubmit={submit}>
        <label htmlFor={inputId} className="sr-only">
          {inputLabel}
        </label>
        <input
          id={inputId}
          name="text"
          type="text"
          className="input add-row__input"
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="done"
        />
        {assignable && (
          <PersonSelect
            value={who}
            onChange={setWho}
            label={`למי: ${inputLabel}`}
            emptyLabel="למי?"
            className="add-row__person"
          />
        )}
        <button type="submit" className="btn btn--primary add-row__btn" aria-label={`הוספה: ${inputLabel}`}>
          <Icon name="plus" size={22} />
          <span className="add-row__btn-text">הוספה</span>
        </button>
      </form>

      {items.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <ul className="items">
          {items.map((item, index) => (
            <li key={item.id} className={item.done ? 'item item--done' : 'item'}>
              <label className="item__check">
                <input
                  id={`${idPrefix}-check-${item.id}`}
                  type="checkbox"
                  className="item__input"
                  checked={item.done}
                  onChange={() => onToggle(item)}
                />
                <span className="checkbox" aria-hidden="true">
                  <Icon name="check" size={20} />
                </span>
                <span className="item__text">{item.text}</span>
              </label>
              {assignable ? (
                <PersonSelect
                  value={item.assignee ?? null}
                  label={`שיוך: ${item.text}`}
                  onChange={(who) => onAssign(item, who)}
                  emptyLabel="—"
                  className="item__person"
                />
              ) : (
                item.assignee !== undefined && <PersonTag person={item.assignee} />
              )}
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                aria-label={`מחיקה: ${item.text}`}
                onClick={() => remove(index)}
              >
                <Icon name="trash" size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
