import type { WidgetId } from '../../hooks/useLayout'

/** מזיז את המשתמש לווידג'ט ומפקס אלמנט בתוכו (אחרי שהוא הוצג). */
export function revealWidget(id: WidgetId, focusId?: string) {
  requestAnimationFrame(() => {
    const widget = document.getElementById(`widget-${id}`)
    const target = (focusId && document.getElementById(focusId)) || widget
    widget?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    target?.focus({ preventScroll: true })
  })
}
