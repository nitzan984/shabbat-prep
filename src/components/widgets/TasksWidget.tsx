import { countDone } from '../../hooks/useChecklist'
import { shabbatTasks, taskActions, useTasks } from '../../hooks/useTasks'
import { SharedBoundary } from '../FamilyGate'
import { ItemList } from './ItemList'

export function TasksWidget() {
  const query = useTasks()

  return (
    <SharedBoundary query={query} errorText="לא הצלחנו לטעון את המטלות.">
      {(all) => {
        const tasks = shabbatTasks(all)
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
              inputLabel="מטלה חדשה לשבת"
              placeholder="מה עוד צריך לעשות?"
              emptyText="אין מטלות כרגע. אפשר להוסיף למעלה."
              onAdd={(text, who) => taskActions.add('shabbat', text, who)}
              onToggle={taskActions.toggle}
              onRemove={taskActions.remove}
              onAssign={taskActions.assign}
            />
            <div className="widget-footer">
              <span className="widget-footer__count" aria-live="polite">
                {leftText}
              </span>
              <button type="button" className="btn btn--soft" disabled={done === 0} onClick={taskActions.clearDoneShabbat}>
                ניקוי מה שבוצע
              </button>
            </div>
          </>
        )
      }}
    </SharedBoundary>
  )
}
