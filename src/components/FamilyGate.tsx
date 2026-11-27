import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { joinFamily } from '../hooks/useFamily'
import type { QueryState } from '../lib/query'
import { Icon } from './ui/Icon'
import { RetryButton, Skeleton } from './ui/InfoCard'

/** טופס קוד משפחה. מופיע במקום רשימה משותפת כשהמכשיר עוד לא מחובר. */
export function FamilyGate() {
  const id = useId()
  // מצב הטופס הוא UI מקומי
  const [status, setStatus] = useState<'idle' | 'busy' | 'invalid' | 'error'>('idle')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = (event.currentTarget.elements.namedItem('code') as HTMLInputElement).value
    setStatus('busy')
    const result = await joinFamily(code)
    setStatus(result === 'ok' ? 'idle' : result)
  }

  return (
    <div className="gate">
      <span className="gate__icon" aria-hidden="true">
        <Icon name="users" size={28} />
      </span>
      <p className="gate__title">הרשימות של המשפחה</p>
      <p className="gate__text">כדי לראות ולערוך יחד, מקלידים פעם אחת את קוד המשפחה, או פותחים את קישור ההזמנה.</p>
      <form className="add-row" onSubmit={submit}>
        <label htmlFor={`${id}-code`} className="sr-only">
          קוד משפחה
        </label>
        <input
          id={`${id}-code`}
          name="code"
          className="input add-row__input"
          placeholder="קוד משפחה"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          dir="ltr"
          required
          aria-describedby={`${id}-msg`}
          aria-invalid={status === 'invalid' || undefined}
        />
        <button type="submit" className="btn btn--primary" disabled={status === 'busy'}>
          {status === 'busy' ? 'בודק…' : 'התחברות'}
        </button>
      </form>
      <p id={`${id}-msg`} className="gate__msg" role="status">
        {status === 'invalid' && 'הקוד לא נכון. בודקים שוב את האותיות.'}
        {status === 'error' && 'אין חיבור כרגע. נסו שוב בעוד רגע.'}
      </p>
    </div>
  )
}

type SharedQuery<T> = Pick<QueryState<T>, 'status' | 'data' | 'isFetching'> & {
  refetch: () => void
  connected: boolean
}

/** עוטף רשימה משותפת: קוד משפחה, טעינה, שגיאה ונתונים שמורים. */
export function SharedBoundary<T>({
  query,
  errorText,
  children,
}: {
  query: SharedQuery<T>
  errorText: string
  children: (data: T) => ReactNode
}) {
  if (!query.connected) return <FamilyGate />
  const { data, status, isFetching, refetch } = query
  if (data !== undefined) {
    return (
      <>
        {status === 'error' && (
          <div className="inline-error" role="status">
            <span>אין חיבור. מוצגים הנתונים האחרונים.</span>
            <RetryButton onRetry={refetch} busy={isFetching} />
          </div>
        )}
        {children(data)}
      </>
    )
  }
  if (status === 'error') {
    return (
      <div className="card-error" role="alert">
        <Icon name="alert" size={22} />
        <p>{errorText}</p>
        <RetryButton onRetry={refetch} busy={isFetching} />
      </div>
    )
  }
  return (
    <>
      <span className="sr-only">טוען…</span>
      <Skeleton lines={4} />
    </>
  )
}
