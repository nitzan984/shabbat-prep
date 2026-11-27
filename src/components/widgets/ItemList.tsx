import type { FormEvent } from 'react'
import type { CheckItem } from '../../hooks/useCheckList'
import { Icon } from '../ui/Icon'

interface ItemActions {
  add: (text: string) => boolean
  toggle: (id: string) => void
  remove: (id: string) => void
}

/** רשימה עם הוספה (גם ב־Enter), סימון ומחיקה. משותפת למטלות ולרשימה הקבועה. */
export function ItemList({
  idPrefix,
  items,
  actions,
  inputLabel,
  placeholder,
  emptyText,
}: {
  idPrefix: string
  items: CheckItem[]
  actions: ItemActions
  inputLabel: string
  placeholder: string
  emptyText: string
}) {
  const inputId = `${idPrefix}-new`

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = event.currentTarget.elements.namedItem('text') as HTMLInputElement
    if (actions.add(input.value)) input.value = ''
    input.focus()
  }

  const remove = (index: number) => {
    const item = items[index]
    const next = items[index + 1] ?? items[index - 1]
    actions.remove(item.id)
    // הפוקוס עובר לפריט הסמוך, או לשדה ההוספה אם הרשימה התרוקנה
    requestAnimationFrame(() =>
      document.getElementById(next ? `${idPrefix}-check-${next.id}` : inputId)?.focus(),
    )
  }

  return (
    <div className="item-list">
      <form className="inline-form" onSubmit={submit}>
        <label htmlFor={inputId} className="sr-only">
          {inputLabel}
        </label>
        <div className="inline-form__row">
          <input id={inputId} name="text" type="text" className="input" placeholder={placeholder} autoComplete="off" enterKeyHint="done" />
          <button type="submit" className="btn btn--primary">
            <Icon name="plus" size={20} />
            הוספה
          </button>
        </div>
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
                  onChange={() => actions.toggle(item.id)}
                />
                <span className="checkbox" aria-hidden="true">
                  <Icon name="check" size={20} />
                </span>
                <span className="item__text">{item.text}</span>
              </label>
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
