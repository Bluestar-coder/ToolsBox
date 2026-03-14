import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Operation, OperationInput, Recipe } from '../../core/operations';
import RecipeEditor from './RecipeEditor';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue ?? _key,
  }),
}));

function createOperation(): Operation {
  return {
    id: 'base64_decode',
    name: 'Base64 Decode',
    description: 'decode base64 text',
    category: 'encoding',
    inputType: 'text',
    outputType: 'text',
    getParameters: () => [],
    validateInput: () => ({ valid: true }),
    execute: async (input: OperationInput) => ({
      success: true,
      output: {
        data: input.data,
        dataType: input.dataType,
      },
    }),
  };
}

function createRecipe(): Recipe {
  const operation = createOperation();
  return {
    id: 'recipe-1',
    name: 'Recipe 1',
    steps: [
      {
        id: 'step-1',
        operation,
        params: {},
        enabled: true,
      },
    ],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('RecipeEditor', () => {
  it('invokes execute and debug actions for the current recipe', () => {
    const recipe = createRecipe();
    const onExecute = vi.fn();
    const onDebug = vi.fn();

    render(
      <RecipeEditor
        recipe={recipe}
        onRecipeChange={vi.fn()}
        onExecute={onExecute}
        onDebug={onDebug}
        operations={[createOperation()]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /执行/ }));
    fireEvent.click(screen.getByRole('button', { name: /调试/ }));

    expect(onExecute).toHaveBeenCalledWith(recipe);
    expect(onDebug).toHaveBeenCalledWith(recipe, 'step-1');
  });

  it('updates step enabled state and breakpoint state', () => {
    const recipe = createRecipe();
    const onRecipeChange = vi.fn();

    render(
      <RecipeEditor
        recipe={recipe}
        onRecipeChange={onRecipeChange}
        onExecute={vi.fn()}
        onDebug={vi.fn()}
        operations={[createOperation()]}
      />
    );

    fireEvent.click(screen.getByRole('switch', { name: '切换步骤启用状态' }));
    expect(onRecipeChange).toHaveBeenCalledWith(expect.objectContaining({
      steps: [expect.objectContaining({ enabled: false })],
    }));

    fireEvent.click(screen.getByRole('button', { name: '添加断点' }));
    expect(onRecipeChange).toHaveBeenLastCalledWith(expect.objectContaining({
      steps: [expect.objectContaining({ isBreakpoint: true })],
    }));
  });
});
