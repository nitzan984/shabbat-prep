import { newId } from '../lib/store'
import { recipesSpec, type CategoryId, type Recipe } from '../services/shared'
import { createCollection } from './useCollection'

export type { CategoryId, Recipe }

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'pastries', label: 'מאפים' },
  { id: 'mains', label: 'עיקריות' },
  { id: 'sides', label: 'תוספות' },
  { id: 'salads', label: 'סלטים' },
  { id: 'desserts', label: 'קינוחים' },
]

export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id

export type RecipeDraft = Omit<Recipe, 'id'>

const recipes = createCollection('recipes', recipesSpec)

export function useRecipes() {
  const query = recipes.use()
  return { ...query, recipes: query.data ?? [] }
}

export const recipeActions = {
  add(draft: RecipeDraft): string {
    const id = newId()
    void recipes.insert({ ...draft, id })
    return id
  },
  update: (id: string, draft: RecipeDraft) => recipes.patch(id, draft),
  remove: (id: string) => recipes.remove(id),
  toggleMenu: (recipe: Recipe) => recipes.patch(recipe.id, { inMenu: !recipe.inMenu }),
}
