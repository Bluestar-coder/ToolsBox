import { beforeEach, describe, expect, it } from 'vitest';
import type { Operation, OperationInput, Recipe } from '../../../core/operations';
import {
  loadSavedRecipesFromStorage,
  resolveUniqueRecipeName,
  saveSavedRecipesToStorage,
  upsertRecipe,
} from './recipe-storage';

function createMockOperation(id: string): Operation {
  return {
    id,
    name: id,
    description: `${id} description`,
    category: 'encoding',
    inputType: 'text',
    outputType: 'text',
    getParameters: () => [],
    execute: async (input: OperationInput) => ({
      success: true,
      output: {
        data: input.data,
        dataType: input.dataType,
      },
    }),
    validateInput: () => ({ valid: true }),
  };
}

function createRecipe(id: string, name: string, operation: Operation): Recipe {
  return {
    id,
    name,
    steps: [
      {
        id: `${id}-step`,
        operation,
        params: {},
        enabled: true,
      },
    ],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('recipe storage', () => {
  const base64Decode = createMockOperation('base64_decode');
  const lookupOperation = (operationId: string) => operationId === base64Decode.id ? base64Decode : undefined;

  beforeEach(() => {
    localStorage.clear();
  });

  it('updates recipes by id without renaming', () => {
    const recipe = createRecipe('recipe-1', 'Demo Recipe', base64Decode);
    const updatedRecipe = {
      ...recipe,
      description: 'updated',
    };

    const result = upsertRecipe([recipe], updatedRecipe);

    expect(result.updated).toBe(true);
    expect(result.nameConflictResolved).toBe(false);
    expect(result.updatedRecipes).toHaveLength(1);
    expect(result.updatedRecipes[0].description).toBe('updated');
    expect(result.resolvedRecipe.name).toBe('Demo Recipe');
  });

  it('resolves name conflicts by creating a unique name instead of overwriting', () => {
    const existingRecipe = createRecipe('recipe-1', 'Demo Recipe', base64Decode);
    const newRecipe = createRecipe('recipe-2', 'Demo Recipe', base64Decode);

    const result = upsertRecipe([existingRecipe], newRecipe);

    expect(result.updated).toBe(false);
    expect(result.nameConflictResolved).toBe(true);
    expect(result.updatedRecipes).toHaveLength(2);
    expect(result.updatedRecipes[0].name).toBe('Demo Recipe');
    expect(result.updatedRecipes[1].name).toBe('Demo Recipe (2)');
  });

  it('persists and loads recipes from localStorage', () => {
    const recipe = createRecipe('recipe-1', 'Stored Recipe', base64Decode);
    saveSavedRecipesToStorage([recipe]);

    const loadedRecipes = loadSavedRecipesFromStorage(lookupOperation);

    expect(loadedRecipes).toHaveLength(1);
    expect(loadedRecipes[0].name).toBe('Stored Recipe');
    expect(loadedRecipes[0].steps[0].operation.id).toBe('base64_decode');
  });

  it('returns the next available recipe name suffix', () => {
    const recipes = [
      createRecipe('recipe-1', 'Demo Recipe', base64Decode),
      createRecipe('recipe-2', 'Demo Recipe (2)', base64Decode),
    ];

    const result = resolveUniqueRecipeName(recipes, 'Demo Recipe');

    expect(result.changed).toBe(true);
    expect(result.name).toBe('Demo Recipe (3)');
  });
});
