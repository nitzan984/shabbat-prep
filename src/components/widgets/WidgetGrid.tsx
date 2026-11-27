import { useState, type DragEvent } from 'react'
import { refreshActiveSection } from '../../hooks/useActiveSection'
import { layoutActions, useLayout, type WidgetId } from '../../hooks/useLayout'
import { announce } from '../../hooks/useNotices'
import { Icon } from '../ui/Icon'
import { WIDGETS } from './registry'

function focusById(...ids: string[]) {
  requestAnimationFrame(() => {
    for (const id of ids) {
      const el = document.getElementById(id) as HTMLButtonElement | null
      if (el && !el.disabled) {
        el.focus()
        return
      }
    }
  })
}

export function WidgetGrid() {
  const layout = useLayout()
  const visible = layout.order.filter((id) => !layout.hidden.includes(id))
  // מצב גרירה הוא UI מקומי בלבד
  const [dragId, setDragId] = useState<WidgetId | null>(null)
  const [overId, setOverId] = useState<WidgetId | null>(null)

  if (visible.length === 0) {
    return (
      <div className="empty-all" role="status">
        <Icon name="layout" size={40} />
        <p className="empty-all__title">כל הווידג'טים מוסתרים</p>
        <p>אפשר להחזיר כל אחד מהם בלחיצה על הצ'יפ שלו בשורה למעלה.</p>
      </div>
    )
  }

  const endDrag = () => {
    setDragId(null)
    setOverId(null)
  }

  const handleDragStart = (event: DragEvent<HTMLElement>, id: WidgetId) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    const card = document.getElementById(`widget-${id}`)
    if (card) event.dataTransfer.setDragImage(card, card.offsetWidth - 40, 28)
    setDragId(id)
  }

  const handleDragOver = (event: DragEvent<HTMLElement>, id: WidgetId) => {
    if (!dragId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (overId !== id) setOverId(id)
  }

  const handleDrop = (event: DragEvent<HTMLElement>, target: WidgetId) => {
    event.preventDefault()
    const from = dragId
    endDrag()
    if (!from || from === target) return
    layoutActions.moveTo(from, target)
    refreshActiveSection()
    announce(`${WIDGETS[from].title} הועבר למקום של ${WIDGETS[target].title}`)
  }

  const move = (id: WidgetId, dir: -1 | 1) => {
    const position = visible.indexOf(id) + dir
    layoutActions.step(id, dir)
    refreshActiveSection()
    announce(`${WIDGETS[id].title} במקום ${position + 1} מתוך ${visible.length}`)
    // React מזיז את ה־DOM ולכן הפוקוס עלול ללכת לאיבוד: מחזירים אותו לכפתור
    focusById(`move-${id}-${dir}`, `move-${id}-${-dir}`)
  }

  const hide = (id: WidgetId) => {
    layoutActions.toggle(id)
    refreshActiveSection()
    announce(`${WIDGETS[id].title} הוסתר. אפשר להחזיר אותו משורת הווידג'טים.`)
    focusById(`toggle-${id}`)
  }

  return (
    <div className="widget-grid">
      {visible.map((id, index) => {
        const { title, icon, Component } = WIDGETS[id]
        const classes = [
          'widget',
          `widget--${id}`,
          dragId === id && 'widget--dragging',
          overId === id && dragId !== id && 'widget--drop-target',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <section
            key={id}
            id={`widget-${id}`}
            className={classes}
            aria-labelledby={`widget-title-${id}`}
            tabIndex={-1}
            onDragOver={(e) => handleDragOver(e, id)}
            onDrop={(e) => handleDrop(e, id)}
          >
            <header className="widget__head">
              <span
                className="drag-handle"
                draggable
                onDragStart={(e) => handleDragStart(e, id)}
                onDragEnd={endDrag}
                title="גרירה לשינוי המיקום"
                aria-hidden="true"
              >
                <Icon name="grip" size={22} />
              </span>
              <h2 className="widget__title" id={`widget-title-${id}`}>
                <Icon name={icon} size={24} />
                {title}
              </h2>
              <div className="widget__actions">
                <button
                  type="button"
                  id={`move-${id}--1`}
                  className="icon-btn icon-btn--on-color"
                  aria-label={`הזזת ${title} למקום הקודם`}
                  disabled={index === 0}
                  onClick={() => move(id, -1)}
                >
                  <Icon name="chevronRight" />
                </button>
                <button
                  type="button"
                  id={`move-${id}-1`}
                  className="icon-btn icon-btn--on-color"
                  aria-label={`הזזת ${title} למקום הבא`}
                  disabled={index === visible.length - 1}
                  onClick={() => move(id, 1)}
                >
                  <Icon name="chevronLeft" />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--on-color"
                  aria-label={`הסתרת ${title}`}
                  onClick={() => hide(id)}
                >
                  <Icon name="eyeOff" />
                </button>
              </div>
            </header>
            <div className="widget__body">
              <Component />
            </div>
          </section>
        )
      })}
    </div>
  )
}
