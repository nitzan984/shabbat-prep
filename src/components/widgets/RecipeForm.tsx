import type { FormEvent } from 'react'
import { showToast } from '../../hooks/useNotices'
import { CATEGORIES, recipeActions, type CategoryId, type Recipe, type RecipeDraft } from '../../hooks/useRecipes'
import { Icon } from '../ui/Icon'

const focusOnMount = (el: HTMLElement | null) => el?.focus()

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

const positiveOrNull = (value: FormDataEntryValue | null) => {
  const n = Number(value)
  return value !== null && String(value).trim() !== '' && Number.isFinite(n) && n > 0 ? Math.round(n) : null
}

/**
 * טופס הוספה ועריכה. השדות לא מבוקרים (defaultValue) ונקראים ב־submit,
 * אז אין state לסנכרן. key של הקומפוננטה מאפס אותו בין מתכונים.
 */
export function RecipeForm({
  recipe,
  onSaved,
  onCancel,
}: {
  recipe: Recipe | undefined
  onSaved: (id: string) => void
  onCancel: () => void
}) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    if (!name) return
    const draft: RecipeDraft = {
      name,
      category: String(form.get('category')) as CategoryId,
      prepMinutes: positiveOrNull(form.get('prepMinutes')),
      servings: positiveOrNull(form.get('servings')),
      timerMinutes: positiveOrNull(form.get('timerMinutes')),
      ingredients: lines(String(form.get('ingredients') ?? '')),
      steps: lines(String(form.get('steps') ?? '')),
      inMenu: form.get('inMenu') === 'on',
    }
    if (recipe) {
      recipeActions.update(recipe.id, draft)
      showToast('המתכון עודכן')
      onSaved(recipe.id)
    } else {
      const id = recipeActions.add(draft)
      showToast('המתכון נוסף')
      onSaved(id)
    }
  }

  return (
    <form className="recipe-form" onSubmit={submit} aria-labelledby="recipe-form-title">
      <h3 id="recipe-form-title" className="recipe-card__title" tabIndex={-1} ref={focusOnMount}>
        {recipe ? `עריכת ${recipe.name}` : 'מתכון חדש'}
      </h3>

      <div className="field">
        <label htmlFor="rf-name">שם המתכון</label>
        <input id="rf-name" name="name" className="input" required defaultValue={recipe?.name} autoComplete="off" />
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor="rf-category">קטגוריה</label>
          <select id="rf-category" name="category" className="input" defaultValue={recipe?.category ?? 'mains'}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="rf-prep">זמן הכנה (דקות)</label>
          <input id="rf-prep" name="prepMinutes" type="number" inputMode="numeric" min={1} max={2000} className="input" defaultValue={recipe?.prepMinutes ?? ''} />
        </div>
        <div className="field">
          <label htmlFor="rf-servings">מספר מנות</label>
          <input id="rf-servings" name="servings" type="number" inputMode="numeric" min={1} max={200} className="input" defaultValue={recipe?.servings ?? ''} />
        </div>
        <div className="field">
          <label htmlFor="rf-timer">טיימר (דקות, לא חובה)</label>
          <input id="rf-timer" name="timerMinutes" type="number" inputMode="numeric" min={1} max={600} className="input" defaultValue={recipe?.timerMinutes ?? ''} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="rf-ingredients">מצרכים</label>
        <textarea id="rf-ingredients" name="ingredients" rows={6} className="input" aria-describedby="rf-ingredients-hint" defaultValue={recipe?.ingredients.join('\n')} />
        <p id="rf-ingredients-hint" className="field__hint">שורה לכל מצרך</p>
      </div>

      <div className="field">
        <label htmlFor="rf-steps">שלבי הכנה</label>
        <textarea id="rf-steps" name="steps" rows={6} className="input" aria-describedby="rf-steps-hint" defaultValue={recipe?.steps.join('\n')} />
        <p id="rf-steps-hint" className="field__hint">שורה לכל שלב</p>
      </div>

      <label className="switch-row">
        <input type="checkbox" name="inMenu" className="item__input" defaultChecked={recipe?.inMenu ?? false} />
        <span className="checkbox" aria-hidden="true">
          <Icon name="check" size={20} />
        </span>
        בתפריט השבת
      </label>

      <div className="recipe-card__footer">
        <button type="submit" className="btn btn--primary">
          <Icon name="check" size={20} />
          שמירה
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  )
}
