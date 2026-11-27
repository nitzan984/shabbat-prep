import { useState } from 'react'
import { useRecipes, type Recipe } from '../../hooks/useRecipes'
import { SharedBoundary } from '../FamilyGate'
import { RecipeDetail } from './RecipeDetail'
import { RecipeForm } from './RecipeForm'
import { RecipeList } from './RecipeList'

type View = { kind: 'list' } | { kind: 'detail'; id: string } | { kind: 'form'; id: string | null }

/** מצב התצוגה (רשימה / כרטיס / טופס) הוא state מקומי. המתכונים עצמם ב־store. */
export function RecipesWidget() {
  const query = useRecipes()
  return (
    <SharedBoundary query={query} errorText="לא הצלחנו לטעון את המתכונים.">
      {(recipes) => <RecipesScreen recipes={recipes} />}
    </SharedBoundary>
  )
}

function RecipesScreen({ recipes }: { recipes: Recipe[] }) {
  const [view, setView] = useState<View>({ kind: 'list' })

  // מתכון שנמחק (למשל בטאב אחר) מחזיר לרשימה
  const current: Recipe | undefined =
    view.kind !== 'list' && view.id ? recipes.find((r) => r.id === view.id) : undefined

  const backToList = (focusRecipeId?: string) => {
    setView({ kind: 'list' })
    if (focusRecipeId) {
      requestAnimationFrame(() => document.getElementById(`recipe-open-${focusRecipeId}`)?.focus())
    }
  }

  if (view.kind === 'form') {
    return (
      <RecipeForm
        key={view.id ?? 'new'}
        recipe={current}
        onSaved={(id) => setView({ kind: 'detail', id })}
        onCancel={() => (current ? setView({ kind: 'detail', id: current.id }) : backToList())}
      />
    )
  }

  if (view.kind === 'detail' && current) {
    return (
      <RecipeDetail
        recipe={current}
        onBack={() => backToList(current.id)}
        onEdit={() => setView({ kind: 'form', id: current.id })}
        onDeleted={() => backToList()}
      />
    )
  }

  return (
    <RecipeList
      recipes={recipes}
      onOpen={(id) => setView({ kind: 'detail', id })}
      onCreate={() => setView({ kind: 'form', id: null })}
    />
  )
}
