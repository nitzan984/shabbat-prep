import type { ReactNode } from 'react'
import { Icon, type IconName } from '../ui/Icon'

/** כרטיס צבעוני עם כותרת, לתוכן של מסך בטלפון (בלי ידיות גרירה). */
export function Panel({
  id,
  tone,
  icon,
  title,
  children,
}: {
  id: string
  tone: 'timer' | 'tasks' | 'checklist' | 'recipes'
  icon: IconName
  title: string
  children: ReactNode
}) {
  return (
    <section id={id} className={`widget widget--${tone} panel`} aria-labelledby={`${id}-title`}>
      <h2 className="panel__title widget__head" id={`${id}-title`}>
        <Icon name={icon} size={24} />
        {title}
      </h2>
      <div className="widget__body">{children}</div>
    </section>
  )
}
