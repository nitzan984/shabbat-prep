import type { ComponentType } from 'react'
import type { WidgetId } from '../../hooks/useLayout'
import type { IconName } from '../ui/Icon'
import { ChecklistWidget } from './ChecklistWidget'
import { RecipesWidget } from './RecipesWidget'
import { TasksWidget } from './TasksWidget'
import { TimerWidget } from './TimerWidget'

export interface WidgetMeta {
  title: string
  icon: IconName
  Component: ComponentType
}

export const WIDGETS: Record<WidgetId, WidgetMeta> = {
  timer: { title: 'טיימר', icon: 'timer', Component: TimerWidget },
  tasks: { title: 'מטלות להיום', icon: 'list', Component: TasksWidget },
  checklist: { title: 'לא לשכוח לפני שבת', icon: 'clipboard', Component: ChecklistWidget },
  recipes: { title: 'המתכונים שלי', icon: 'chef', Component: RecipesWidget },
}
