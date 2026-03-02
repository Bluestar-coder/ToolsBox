import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { operationRegistry, type OperationInput } from '../../../core/operations';
import type { Recipe } from '../../../core/operations';
import RecipeTool from './RecipeTool';

const { mockRecipe } = vi.hoisted(() => ({
  mockRecipe: {
    id: 'recipe_test',
    name: 'Mock Recipe',
    steps: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as Recipe,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue ?? _key,
  }),
}));

vi.mock('../../../components/RecipeWorkbench/RecipeWorkbench', () => ({
  default: ({ onRecipeChange }: { onRecipeChange?: (recipe: Recipe) => void }) => (
    <button type="button" onClick={() => onRecipeChange?.(mockRecipe)}>
      emit recipe
    </button>
  ),
}));

describe('RecipeTool', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    operationRegistry.clear();
    operationRegistry.register({
      id: 'mock_op',
      name: 'Mock Operation',
      description: 'mock',
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
    });
    localStorage.clear();
    vi.spyOn(message, 'success').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'warning').mockImplementation(() => ({}) as never);
  });

  it('persists current recipe when clicking header save', async () => {
    render(<RecipeTool />);

    const saveButton = screen.getByRole('button', { name: /保存/ });
    expect(saveButton).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'emit recipe' }));

    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });

    fireEvent.click(saveButton);

    const rawSavedRecipes = localStorage.getItem('recipe-tool-saved-recipes');
    expect(rawSavedRecipes).not.toBeNull();
    const savedRecipes = JSON.parse(rawSavedRecipes as string) as Array<{ name: string }>;
    expect(savedRecipes).toHaveLength(1);
    expect(savedRecipes[0].name).toBe('Mock Recipe');
  });

  it('loads valid recipes even when storage contains invalid entries', () => {
    localStorage.setItem(
      'recipe-tool-saved-recipes',
      JSON.stringify([
        {
          id: 'recipe_valid',
          name: 'Valid Recipe',
          steps: [
            {
              id: 'step_1',
              operationId: 'mock_op',
              params: {},
              enabled: true,
            },
          ],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'recipe_invalid',
          name: 'Invalid Recipe',
          steps: [
            {
              id: 'step_bad',
              operationId: 'unknown_op',
              params: {},
              enabled: true,
            },
          ],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ])
    );

    render(<RecipeTool />);
    expect(screen.getByRole('button', { name: '加载 (1)' })).toBeEnabled();
  });
});
