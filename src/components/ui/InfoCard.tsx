import type { ReactNode } from 'react'
import type { QueryState } from '../../lib/query'
import { Icon, type IconName } from './Icon'

type QueryLike<T> = Pick<QueryState<T>, 'status' | 'data' | 'isFetching'> & { refetch: () => void }

export function RetryButton({ onRetry, busy }: { onRetry: () => void; busy: boolean }) {
  return (
    <button type="button" className="btn btn--small btn--ghost" onClick={onRetry} disabled={busy}>
      <Icon name="refresh" size={18} className={busy ? 'spin' : undefined} />
      {busy ? 'טוען…' : 'נסה שוב'}
    </button>
  )
}

export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton__line" style={{ inlineSize: `${90 - i * 15}%` }} />
      ))}
    </div>
  )
}

/**
 * מעטפת לכרטיס מידע שמבוסס על server state:
 * skeleton בטעינה, הודעה עם "נסה שוב" בשגיאה, ונתונים שמורים אם יש.
 */
export function InfoCard<T>({
  title,
  icon,
  tone,
  query,
  errorText,
  children,
}: {
  title: string
  icon: IconName
  tone: 'calendar' | 'parasha' | 'zmanim' | 'weather'
  query: QueryLike<T>
  errorText: string
  children: (data: T) => ReactNode
}) {
  const { data, status, isFetching, refetch } = query
  return (
    <section className={`info-card info-card--${tone}`} aria-busy={status === 'loading'}>
      <h2 className="info-card__title">
        <span className="info-card__icon">
          <Icon name={icon} size={22} />
        </span>
        {title}
      </h2>
      {data !== undefined ? (
        <>
          {children(data)}
          {status === 'error' && (
            <div className="inline-error" role="status">
              <span>לא הצלחנו לרענן. מוצגים נתונים שמורים.</span>
              <RetryButton onRetry={refetch} busy={isFetching} />
            </div>
          )}
        </>
      ) : status === 'error' ? (
        <div className="card-error" role="alert">
          <Icon name="alert" size={22} />
          <p>{errorText}</p>
          <RetryButton onRetry={refetch} busy={isFetching} />
        </div>
      ) : (
        <>
          <span className="sr-only">טוען…</span>
          <Skeleton />
        </>
      )}
    </section>
  )
}
