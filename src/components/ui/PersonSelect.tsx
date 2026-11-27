import { isPersonId, PEOPLE, type PersonId } from '../../lib/family'

/** בחירת אדם (שיר / מיכל / איתן / בלי שיוך), בצבע של האדם שנבחר. */
export function PersonSelect({
  value,
  onChange,
  label,
  id,
  emptyLabel = 'בלי שיוך',
  className = '',
}: {
  value: PersonId | null
  onChange: (value: PersonId | null) => void
  /** תווית לקורא מסך כשאין <label> חיצוני (בלי id) */
  label: string
  id?: string
  emptyLabel?: string
  className?: string
}) {
  return (
    <select
      id={id}
      aria-label={id ? undefined : label}
      className={`person-select person-select--${value ?? 'none'} ${className}`}
      value={value ?? ''}
      onChange={(e) => onChange(isPersonId(e.target.value) ? e.target.value : null)}
    >
      <option value="">{emptyLabel}</option>
      {PEOPLE.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  )
}

/** תגית צבעונית עם שם האדם, או "כל המשפחה" */
export function PersonTag({ person, familyLabel }: { person: PersonId | null; familyLabel?: string }) {
  const name = person ? PEOPLE.find((p) => p.id === person)?.name : familyLabel
  if (!name) return null
  return <span className={`person-tag person-tag--${person ?? 'family'}`}>{name}</span>
}
