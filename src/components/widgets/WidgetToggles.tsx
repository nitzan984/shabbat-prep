import { refreshActiveSection } from '../../hooks/useActiveSection'
import { layoutActions, useLayout } from '../../hooks/useLayout'
import { Icon } from '../ui/Icon'
import { WIDGETS } from './registry'

/** שורת צ'יפים: לכל ווידג'ט כפתור הצגה/הסתרה. */
export function WidgetToggles() {
  const layout = useLayout()
  return (
    <nav className="toggles" aria-label="הצגה והסתרה של ווידג'טים">
      <span className="toggles__label">
        <Icon name="layout" size={20} />
        ווידג'טים
      </span>
      <ul className="toggles__list">
        {layout.order.map((id) => {
          const visible = !layout.hidden.includes(id)
          const meta = WIDGETS[id]
          return (
            <li key={id}>
              <button
                type="button"
                id={`toggle-${id}`}
                className={`toggle toggle--${id}`}
                aria-pressed={visible}
                onClick={() => {
                  layoutActions.toggle(id)
                  refreshActiveSection()
                }}
              >
                <Icon name={meta.icon} size={20} />
                {meta.title}
                <Icon name={visible ? 'eye' : 'eyeOff'} size={18} className="toggle__state" />
                <span className="sr-only">{visible ? '(מוצג)' : '(מוסתר)'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
