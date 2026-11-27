import { taskActions, tasksStore } from '../../hooks/useCheckList'
import { layoutActions } from '../../hooks/useLayout'
import { showToast } from '../../hooks/useNotices'
import { categoryLabel, recipeActions, type Recipe } from '../../hooks/useRecipes'
import { timerActions } from '../../hooks/useTimer'
import { formatMinutes } from '../../lib/time'
import { Icon } from '../ui/Icon'
import { revealWidget } from './reveal'
import { MenuStar } from './RecipeList'

/** פוקוס לכותרת כשהכרטיס נפתח. פונקציה קבועה, אז רצה רק בהרכבה. */
const focusOnMount = (el: HTMLElement | null) => el?.focus()

export function RecipeDetail({
  recipe,
  onBack,
  onEdit,
  onDeleted,
}: {
  recipe: Recipe
  onBack: () => void
  onEdit: () => void
  onDeleted: () => void
}) {
  const timerMinutes = recipe.timerMinutes ?? recipe.prepMinutes

  const setTimer = () => {
    if (!timerMinutes) return
    timerActions.setMinutes(timerMinutes, recipe.name)
    layoutActions.show('timer')
    showToast(`הטיימר כוון ל־${formatMinutes(timerMinutes)} עבור ${recipe.name}`)
    revealWidget('timer', 'timer-start')
  }

  const addToTasks = () => {
    const text = `להכין ${recipe.name}`
    const exists = tasksStore.get().some((t) => t.text === text && !t.done)
    if (exists) {
      showToast('המטלה כבר נמצאת ברשימה')
      return
    }
    taskActions.add(text)
    showToast(`נוסף למטלות: ${text}`)
  }

  const remove = () => {
    if (!window.confirm(`למחוק את המתכון "${recipe.name}"?`)) return
    recipeActions.remove(recipe.id)
    showToast('המתכון נמחק')
    onDeleted()
  }

  return (
    <article className="recipe-card" aria-labelledby="recipe-card-title">
      <button type="button" className="btn btn--ghost btn--small" onClick={onBack}>
        <Icon name="back" size={20} />
        חזרה לרשימה
      </button>

      <header className="recipe-card__head">
        <h3 id="recipe-card-title" className="recipe-card__title" tabIndex={-1} ref={focusOnMount}>
          {recipe.name}
        </h3>
        <span className="tag">{categoryLabel(recipe.category)}</span>
      </header>

      <ul className="recipe-card__meta">
        {recipe.prepMinutes ? (
          <li>
            <Icon name="clock" size={20} />
            זמן הכנה: {formatMinutes(recipe.prepMinutes)}
          </li>
        ) : null}
        {recipe.servings ? (
          <li>
            <Icon name="users" size={20} />
            {recipe.servings} מנות
          </li>
        ) : null}
        {recipe.timerMinutes ? (
          <li>
            <Icon name="timer" size={20} />
            טיימר: {formatMinutes(recipe.timerMinutes)}
          </li>
        ) : null}
      </ul>

      <div className="recipe-card__actions">
        <MenuStar recipe={recipe} withText />
        <button type="button" className="btn btn--accent" onClick={setTimer} disabled={!timerMinutes}>
          <Icon name="timer" size={20} />
          טיימר ל{recipe.name}
          {timerMinutes ? ` (${formatMinutes(timerMinutes)})` : ''}
        </button>
        <button type="button" className="btn btn--soft" onClick={addToTasks}>
          <Icon name="list" size={20} />
          הוספה למטלות
        </button>
      </div>

      <section className="recipe-card__section">
        <h4>מצרכים</h4>
        {recipe.ingredients.length ? (
          <ul className="ingredients">
            {recipe.ingredients.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="muted">לא נרשמו מצרכים.</p>
        )}
      </section>

      <section className="recipe-card__section">
        <h4>אופן ההכנה</h4>
        {recipe.steps.length ? (
          <ol className="steps">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        ) : (
          <p className="muted">לא נרשמו שלבי הכנה.</p>
        )}
      </section>

      <footer className="recipe-card__footer">
        <button type="button" className="btn btn--soft" onClick={onEdit}>
          <Icon name="edit" size={20} />
          עריכה
        </button>
        <button type="button" className="btn btn--danger" onClick={remove}>
          <Icon name="trash" size={20} />
          מחיקה
        </button>
      </footer>
    </article>
  )
}
