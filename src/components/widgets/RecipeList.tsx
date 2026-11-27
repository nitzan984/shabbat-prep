import { useState } from 'react'
import { CATEGORIES, categoryLabel, recipeActions, type CategoryId, type Recipe } from '../../hooks/useRecipes'
import { formatMinutes } from '../../lib/time'
import { Icon } from '../ui/Icon'

type Filter = 'all' | 'menu' | CategoryId

function recipeMeta(recipe: Recipe): string {
  return [
    categoryLabel(recipe.category),
    recipe.prepMinutes ? formatMinutes(recipe.prepMinutes) : null,
    recipe.servings ? `${recipe.servings} מנות` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function MenuStar({ recipe, withText = false }: { recipe: Recipe; withText?: boolean }) {
  return (
    <button
      type="button"
      className={`star-btn${recipe.inMenu ? ' star-btn--on' : ''}${withText ? ' star-btn--text' : ''}`}
      aria-pressed={recipe.inMenu}
      aria-label={withText ? undefined : `בתפריט השבת: ${recipe.name}`}
      onClick={() => void recipeActions.toggleMenu(recipe)}
    >
      <Icon name="star" size={24} />
      {withText && (recipe.inMenu ? 'בתפריט השבת' : 'הוספה לתפריט השבת')}
    </button>
  )
}

export function RecipeList({
  recipes,
  onOpen,
  onCreate,
}: {
  recipes: Recipe[]
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const term = search.trim()
  const shown = recipes.filter((r) => {
    if (filter === 'menu' && !r.inMenu) return false
    if (filter !== 'all' && filter !== 'menu' && r.category !== filter) return false
    if (!term) return true
    return r.name.includes(term) || r.ingredients.some((i) => i.includes(term))
  })

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'הכל', count: recipes.length },
    { id: 'menu', label: 'בתפריט השבת', count: recipes.filter((r) => r.inMenu).length },
    ...CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      count: recipes.filter((r) => r.category === c.id).length,
    })),
  ]

  return (
    <div className="recipes">
      <div className="recipes__toolbar">
        <div className="search">
          <label htmlFor="recipe-search" className="sr-only">
            חיפוש מתכון
          </label>
          <Icon name="search" size={20} className="search__icon" />
          <input
            id="recipe-search"
            type="search"
            className="input search__input"
            placeholder="חיפוש לפי שם או מצרך"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="button" className="btn btn--primary" onClick={onCreate}>
          <Icon name="plus" size={20} />
          מתכון חדש
        </button>
      </div>

      <div className="filter-chips" role="group" aria-label="סינון לפי קטגוריה">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            className="chip-btn"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.id === 'menu' && <Icon name="star" size={16} />}
            {f.label}
            <span className="chip-btn__count">{f.count}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="empty">
          {recipes.length === 0 ? 'עוד אין מתכונים. אפשר להוסיף את הראשון.' : 'לא נמצאו מתכונים שמתאימים לחיפוש.'}
        </p>
      ) : (
        <ul className="recipe-rows">
          {shown.map((recipe) => (
            <li key={recipe.id} className="recipe-row">
              <button
                type="button"
                id={`recipe-open-${recipe.id}`}
                className="recipe-row__open"
                onClick={() => onOpen(recipe.id)}
              >
                <span className="recipe-row__name">{recipe.name}</span>
                <span className="recipe-row__meta">{recipeMeta(recipe)}</span>
              </button>
              <MenuStar recipe={recipe} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
