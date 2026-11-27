import { countDone, taskActions, useTasks } from '../../hooks/useCheckList'
import { ItemList } from './ItemList'

export function TasksWidget() {
  const tasks = useTasks()
  const done = countDone(tasks)
  const left = tasks.length - done
  const leftText =
    tasks.length === 0
      ? 'אין מטלות'
      : left === 0
        ? 'הכל בוצע!'
        : left === 1
          ? 'נשארה מטלה אחת'
          : `נשארו ${left} מטלות`

  return (
    <>
      <ItemList
        idPrefix="task"
        items={tasks}
        actions={taskActions}
        inputLabel="מטלה חדשה"
        placeholder="מה עוד צריך לעשות היום?"
        emptyText="אין מטלות כרגע. אפשר להוסיף למעלה."
      />
      <div className="widget-footer">
        <span className="widget-footer__count" aria-live="polite">
          {leftText}
        </span>
        <button type="button" className="btn btn--soft" disabled={done === 0} onClick={taskActions.clearDone}>
          ניקוי מה שבוצע
        </button>
      </div>
    </>
  )
}
