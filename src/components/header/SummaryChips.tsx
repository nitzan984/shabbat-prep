import { countDone, useChecklist, useTasks } from '../../hooks/useCheckList'
import { useRecipes } from '../../hooks/useRecipes'
import { Icon } from '../ui/Icon'

export function SummaryChips() {
  const tasks = useTasks()
  const checklist = useChecklist()
  const recipes = useRecipes()

  const tasksDone = countDone(tasks)
  const checklistDone = countDone(checklist)
  const menuCount = recipes.filter((r) => r.inMenu).length
  const total = tasks.length + checklist.length
  const percent = total === 0 ? 0 : Math.round(((tasksDone + checklistDone) / total) * 100)

  return (
    <section className="summary" aria-label="סיכום ההכנות">
      <ul className="summary__chips">
        <li className="chip chip--tasks">
          <Icon name="list" size={20} />
          מטלות {tasksDone}/{tasks.length}
        </li>
        <li className="chip chip--checklist">
          <Icon name="clipboard" size={20} />
          רשימה קבועה {checklistDone}/{checklist.length}
        </li>
        <li className="chip chip--recipes">
          <Icon name="star" size={20} />
          {menuCount === 1 ? 'מנה אחת בתפריט' : `${menuCount} מנות בתפריט`}
        </li>
      </ul>
      <div className="progress">
        <div className="progress__label" id="overall-progress-label">
          <span>התקדמות כללית</span>
          <strong>{percent}%</strong>
        </div>
        <div
          className="progress__track"
          role="progressbar"
          aria-labelledby="overall-progress-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div className="progress__fill" style={{ inlineSize: `${percent}%` }} />
        </div>
      </div>
    </section>
  )
}
