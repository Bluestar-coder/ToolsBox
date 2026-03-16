import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message, Modal } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { operationRegistry, type OperationInput } from '../../../core/operations';
import type { Recipe } from '../../../core/operations';
import RecipeTool from './RecipeTool';

const { mockRecipe, mockRecipeRenameSameName } = vi.hoisted(() => ({
  mockRecipe: {
    id: 'recipe_test',
    name: 'Mock Recipe',
    steps: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } as Recipe,
  mockRecipeRenameSameName: {
    id: 'recipe_test_v2',
    name: 'Mock Recipe',
    steps: [],
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  } as Recipe,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string, options?: Record<string, string>) =>
      (defaultValue ?? _key)
        .replace('{{name}}', options?.name ?? '')
        .replace('{{error}}', options?.error ?? ''),
  }),
}));

vi.mock('../../../components/RecipeWorkbench/RecipeWorkbench', () => ({
  default: ({ onRecipeChange }: { onRecipeChange?: (recipe: Recipe) => void }) => (
    <div>
      <button type="button" onClick={() => onRecipeChange?.(mockRecipe)}>
        emit recipe
      </button>
      <button type="button" onClick={() => onRecipeChange?.(mockRecipeRenameSameName)}>
        emit recipe rename id
      </button>
    </div>
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
    vi.spyOn(message, 'error').mockImplementation(() => ({}) as never);
  });

  it('persists current recipe when clicking header save', async () => {
    render(<RecipeTool />);

    const saveButton = screen.getByRole('button', { name: /保存/ });
    expect(saveButton).toBeDisabled();

    fireEvent.click(await screen.findByRole('button', { name: 'emit recipe' }));

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

  it('loads valid recipes even when storage contains invalid entries', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

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

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '加载 (1)' })).toBeEnabled();
    });
    expect(warnSpy).toHaveBeenCalled();
  });

  it('creates a uniquely named recipe instead of silently overwriting by name', async () => {
    render(<RecipeTool />);

    const saveButton = screen.getByRole('button', { name: /保存/ });

    fireEvent.click(await screen.findByRole('button', { name: 'emit recipe' }));
    await waitFor(() => {
      expect(saveButton).toBeEnabled();
    });
    fireEvent.click(saveButton);

    fireEvent.click(await screen.findByRole('button', { name: 'emit recipe rename id' }));
    fireEvent.click(saveButton);

    const rawSavedRecipes = localStorage.getItem('recipe-tool-saved-recipes');
    expect(rawSavedRecipes).not.toBeNull();
    const savedRecipes = JSON.parse(rawSavedRecipes as string) as Array<{ id: string; name: string }>;
    expect(savedRecipes).toHaveLength(2);
    expect(savedRecipes[0].name).toBe('Mock Recipe');
    expect(savedRecipes[0].id).toBe('recipe_test');
    expect(savedRecipes[1].id).toBe('recipe_test_v2');
    expect(savedRecipes[1].name).toBe('Mock Recipe (2)');
  });

  it('exports the current recipe as a json file', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:recipe');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const anchorClick = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        const anchor = originalCreateElement('a');
        anchor.click = anchorClick;
        return anchor;
      }

      return originalCreateElement(tagName);
    });

    render(<RecipeTool />);
    fireEvent.click(await screen.findByRole('button', { name: 'emit recipe' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /导出/ })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /导出/ }));

    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:recipe');
  });

  it('clears the current recipe after confirmation', async () => {
    vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      void config.onOk?.();
      return { destroy: vi.fn(), update: vi.fn() };
    });

    render(<RecipeTool />);
    fireEvent.click(await screen.findByRole('button', { name: 'emit recipe' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /清空/ })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /清空/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /保存/ })).toBeDisabled();
    });
    expect(message.success).toHaveBeenCalledWith('Recipe已清空');
  });

  it('loads and deletes a saved recipe from the modal list', async () => {
    vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      void config.onOk?.();
      return { destroy: vi.fn(), update: vi.fn() };
    });

    localStorage.setItem(
      'recipe-tool-saved-recipes',
      JSON.stringify([
        {
          version: 2,
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
      ])
    );

    render(<RecipeTool />);

    fireEvent.click(screen.getByRole('button', { name: '加载 (1)' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /加\s*载/ }));

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('Recipe已加载');
    });

    fireEvent.click(screen.getByRole('button', { name: '加载 (1)' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /删\s*除/ }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '加载 (0)' })).toBeDisabled();
    });
    expect(message.success).toHaveBeenCalledWith('Recipe已删除');
  });

  it('imports a recipe and auto-renames on name conflict', async () => {
    localStorage.setItem(
      'recipe-tool-saved-recipes',
      JSON.stringify([
        {
          version: 2,
          id: 'recipe_existing',
          name: 'Mock Recipe',
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
      ])
    );

    const importedPayload = JSON.stringify({
      version: 2,
      id: 'recipe_imported',
      name: 'Mock Recipe',
      steps: [
        {
          id: 'step_imported',
          operationId: 'mock_op',
          params: {},
          enabled: true,
        },
      ],
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    });

    class MockFileReader {
      onload: ((event: { target: { result: string } }) => void) | null = null;

      readAsText() {
        this.onload?.({ target: { result: importedPayload } });
      }
    }

    const originalCreateElement = document.createElement.bind(document);
    let inputElement: HTMLInputElement | null = null;
    vi.stubGlobal('FileReader', MockFileReader);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'input') {
        inputElement = originalCreateElement('input');
        return inputElement;
      }

      return originalCreateElement(tagName);
    });

    render(<RecipeTool />);
    fireEvent.click(screen.getByRole('button', { name: /导入/ }));

    expect(inputElement).not.toBeNull();
    await act(async () => {
      inputElement?.onchange?.({
        target: {
          files: [new File(['recipe'], 'recipe.json', { type: 'application/json' })],
        },
      } as unknown as Event);
    });

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith(
        'Recipe已导入，名称冲突，已自动重命名为 "Mock Recipe (2)"'
      );
    });
  });
});
