import type { Operation, Recipe } from '../../../core/operations';
import {
  deserializeRecipe,
  serializeRecipes,
  type SerializedRecipe,
} from './recipe-serialization';

export const SAVED_RECIPES_STORAGE_KEY = 'recipe-tool-saved-recipes';
export const ACTIVE_RECIPE_ID_STORAGE_KEY = 'recipe-tool-active-recipe-id';

export interface RecipeInitialState {
  savedRecipes: Recipe[];
  activeRecipe: Recipe | null;
}

export interface UpsertRecipeResult {
  updatedRecipes: Recipe[];
  updated: boolean;
  nameConflictResolved: boolean;
  resolvedRecipe: Recipe;
}

function getBaseRecipeName(name: string): string {
  const trimmed = name.trim();
  return trimmed || 'Untitled Recipe';
}

export function resolveUniqueRecipeName(
  recipes: Recipe[],
  desiredName: string,
  excludeRecipeId?: string
): { name: string; changed: boolean } {
  const baseName = getBaseRecipeName(desiredName);
  const usedNames = new Set(
    recipes
      .filter((recipe) => recipe.id !== excludeRecipeId)
      .map((recipe) => recipe.name)
  );

  if (!usedNames.has(baseName)) {
    return { name: baseName, changed: false };
  }

  let suffix = 2;
  let candidate = `${baseName} (${suffix})`;
  while (usedNames.has(candidate)) {
    suffix += 1;
    candidate = `${baseName} (${suffix})`;
  }

  return { name: candidate, changed: true };
}

export function upsertRecipe(recipes: Recipe[], targetRecipe: Recipe): UpsertRecipeResult {
  const byIdIndex = recipes.findIndex((saved) => saved.id === targetRecipe.id);
  const { name, changed } = resolveUniqueRecipeName(
    recipes,
    targetRecipe.name,
    byIdIndex >= 0 ? targetRecipe.id : undefined
  );
  const resolvedRecipe = changed
    ? {
        ...targetRecipe,
        name,
      }
    : targetRecipe;

  if (byIdIndex >= 0) {
    const updatedRecipes = [...recipes];
    updatedRecipes[byIdIndex] = resolvedRecipe;
    return {
      updatedRecipes,
      updated: true,
      nameConflictResolved: changed,
      resolvedRecipe,
    };
  }

  return {
    updatedRecipes: [...recipes, resolvedRecipe],
    updated: false,
    nameConflictResolved: changed,
    resolvedRecipe,
  };
}

export function saveSavedRecipesToStorage(recipes: Recipe[]): void {
  localStorage.setItem(SAVED_RECIPES_STORAGE_KEY, JSON.stringify(serializeRecipes(recipes)));
}

export function loadSavedRecipesFromStorage(
  lookupOperation: (operationId: string) => Operation | undefined
): Recipe[] {
  try {
    const raw = localStorage.getItem(SAVED_RECIPES_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('Saved recipes payload is not an array, ignored.');
      return [];
    }

    const loadedRecipes: Recipe[] = [];
    (parsed as SerializedRecipe[]).forEach((item, index) => {
      try {
        loadedRecipes.push(deserializeRecipe(item, lookupOperation));
      } catch (error) {
        console.warn(`Skipped invalid saved recipe at index ${index}:`, error);
      }
    });

    return loadedRecipes;
  } catch (error) {
    console.warn('Failed to load saved recipes from localStorage:', error);
    return [];
  }
}

export function saveActiveRecipeId(recipeId: string | null): void {
  if (recipeId === null) {
    localStorage.removeItem(ACTIVE_RECIPE_ID_STORAGE_KEY);
    return;
  }

  localStorage.setItem(ACTIVE_RECIPE_ID_STORAGE_KEY, recipeId);
}

export function loadActiveRecipeId(): string | null {
  return localStorage.getItem(ACTIVE_RECIPE_ID_STORAGE_KEY);
}

export function getInitialRecipeState(
  operationsReady: boolean,
  lookupOperation: (operationId: string) => Operation | undefined
): RecipeInitialState {
  if (!operationsReady) {
    return {
      savedRecipes: [],
      activeRecipe: null,
    };
  }

  const savedRecipes = loadSavedRecipesFromStorage(lookupOperation);
  const activeRecipeId = loadActiveRecipeId();

  return {
    savedRecipes,
    activeRecipe: activeRecipeId
      ? savedRecipes.find((saved) => saved.id === activeRecipeId) ?? null
      : null,
  };
}
