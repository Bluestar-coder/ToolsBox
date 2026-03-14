import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Operation, OperationInput, Recipe } from '../../core/operations';
import RecipeEditor from './RecipeEditor';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue ?? _key,
  }),
}));

function createOperation(options?: { withParams?: boolean; id?: string; name?: string }): Operation {
  return {
    id: options?.id ?? 'base64_decode',
    name: options?.name ?? 'Base64 Decode',
    description: 'decode base64 text',
    category: 'encoding',
    inputType: 'text',
    outputType: 'text',
    getParameters: () => options?.withParams ? [
      {
        name: 'charset',
        type: 'string',
        defaultValue: 'utf-8',
        description: 'Charset',
        required: true,
      },
    ] : [],
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

  it('adds the first operation when the recipe is empty', async () => {
    const user = userEvent.setup();
    const onRecipeChange = vi.fn();
    const operation = createOperation();
    const emptyRecipe: Recipe = {
      id: 'recipe-empty',
      name: 'Empty',
      steps: [],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    render(
      <RecipeEditor
        recipe={emptyRecipe}
        onRecipeChange={onRecipeChange}
        onExecute={vi.fn()}
        onDebug={vi.fn()}
        operations={[operation]}
      />
    );

    await user.click(screen.getByRole('button', { name: /添加第一个操作/ }));
    await user.click(await screen.findByText('Base64 Decode'));

    expect(onRecipeChange).toHaveBeenCalledWith(expect.objectContaining({
      steps: [expect.objectContaining({ operation })],
    }));
  });

  it('opens the edit modal and saves parameter changes', async () => {
    const user = userEvent.setup();
    const operation = createOperation({ withParams: true });
    const recipe: Recipe = {
      ...createRecipe(),
      steps: [
        {
          id: 'step-1',
          operation,
          params: { charset: 'utf-8' },
          enabled: true,
        },
      ],
    };
    const onRecipeChange = vi.fn();

    render(
      <RecipeEditor
        recipe={recipe}
        onRecipeChange={onRecipeChange}
        onExecute={vi.fn()}
        onDebug={vi.fn()}
        operations={[operation]}
      />
    );

    await user.click(screen.getByRole('button', { name: '步骤操作' }));
    await user.click(await screen.findByText('编辑参数'));

    const input = await screen.findByLabelText('Charset');
    await user.clear(input);
    await user.type(input, 'latin1');
    await user.click(screen.getByRole('button', { name: /OK|确 定|确定/ }));

    await waitFor(() => {
      expect(onRecipeChange).toHaveBeenLastCalledWith(expect.objectContaining({
        steps: [expect.objectContaining({ params: { charset: 'latin1' } })],
      }));
    });
  });

  it('duplicates and deletes steps through the actions menu', async () => {
    const user = userEvent.setup();
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

    await user.click(screen.getByRole('button', { name: '步骤操作' }));
    await user.click(await screen.findByText('复制步骤'));
    expect(onRecipeChange).toHaveBeenCalledWith(expect.objectContaining({
      steps: expect.arrayContaining([
        expect.objectContaining({ id: 'step-1' }),
      ]),
    }));
    expect(onRecipeChange.mock.calls.at(-1)?.[0].steps).toHaveLength(2);

    onRecipeChange.mockClear();
    await user.click(screen.getByRole('button', { name: '步骤操作' }));
    await user.click(await screen.findByText('删除步骤'));

    expect(onRecipeChange).toHaveBeenLastCalledWith(expect.objectContaining({
      steps: [],
    }));
  });
});
