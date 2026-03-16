import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { operationRegistry, type OperationInput } from '../../../core/operations';
import type { Recipe } from '../../../core/operations';
import RecipeTool from './RecipeTool';

const mockGetRuntimeInfo = vi.fn();
const mockOpenRuntimePath = vi.fn();
const mockSaveNativeRecipeSnapshot = vi.fn();
const mockListNativeRecipeSnapshots = vi.fn();
const mockReadNativeRecipeSnapshot = vi.fn();

const mockRecipe = {
  id: 'recipe_native',
  name: 'Native Recipe',
  steps: [],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
} as Recipe;

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
    <button type="button" onClick={() => onRecipeChange?.(mockRecipe)}>
      emit native recipe
    </button>
  ),
}));

vi.mock('../../../utils/runtime-info', () => ({
  getRuntimeInfo: () => mockGetRuntimeInfo(),
  openRuntimePath: (...args: unknown[]) => mockOpenRuntimePath(...args),
}));

vi.mock('../utils/recipe-native', () => ({
  saveNativeRecipeSnapshot: (...args: unknown[]) => mockSaveNativeRecipeSnapshot(...args),
  listNativeRecipeSnapshots: () => mockListNativeRecipeSnapshots(),
  readNativeRecipeSnapshot: (...args: unknown[]) => mockReadNativeRecipeSnapshot(...args),
}));

describe('RecipeTool native snapshots', () => {
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
    mockGetRuntimeInfo.mockResolvedValue({
      platform: 'darwin',
      arch: 'aarch64',
      app_version: '0.1.0',
      debug: false,
      desktop: true,
      native_http: true,
      window_state: true,
      native_fs: true,
      path_opener: true,
      hostname: 'toolsbox-dev',
      app_data_dir: '/tmp/toolsbox/data',
      app_config_dir: '/tmp/toolsbox/config',
      temp_dir: '/tmp/toolsbox',
      recipe_snapshots_dir: '/tmp/toolsbox/recipe-snapshots',
    });
    mockOpenRuntimePath.mockResolvedValue(true);
    mockSaveNativeRecipeSnapshot.mockResolvedValue('/tmp/toolsbox/recipe-snapshots/Native_Recipe.json');
    mockListNativeRecipeSnapshots.mockResolvedValue([
      {
        name: 'Native_Recipe',
        path: '/tmp/toolsbox/recipe-snapshots/Native_Recipe.json',
        size_bytes: 128,
        modified_unix_ms: 1700000000000,
      },
    ]);
    mockReadNativeRecipeSnapshot.mockResolvedValue(JSON.stringify({
      version: 2,
      id: 'recipe_from_disk',
      name: 'Native Recipe',
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
    }));

    vi.spyOn(message, 'success').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'warning').mockImplementation(() => ({}) as never);
    vi.spyOn(message, 'error').mockImplementation(() => ({}) as never);
  });

  it('saves, lists, loads and opens native recipe snapshots in desktop mode', async () => {
    render(<RecipeTool />);

    fireEvent.click(await screen.findByRole('button', { name: 'emit native recipe' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /保存本地快照/ })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /保存本地快照/ }));
    await waitFor(() => {
      expect(mockSaveNativeRecipeSnapshot).toHaveBeenCalledWith(
        'Native Recipe',
        expect.stringContaining('"version": 2')
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /加载本地快照/ }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(mockListNativeRecipeSnapshots).toHaveBeenCalled();
    expect(screen.getByText('Native_Recipe')).toBeInTheDocument();

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /加\s*载/ }));
    await waitFor(() => {
      expect(mockReadNativeRecipeSnapshot).toHaveBeenCalledWith('/tmp/toolsbox/recipe-snapshots/Native_Recipe.json');
    });
    expect(message.success).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /打开本地目录/ }));
    expect(mockOpenRuntimePath).toHaveBeenCalledWith('/tmp/toolsbox/recipe-snapshots');
  });

  it('shows an error when native snapshot save fails', async () => {
    mockSaveNativeRecipeSnapshot.mockResolvedValueOnce(null);

    render(<RecipeTool />);
    fireEvent.click(await screen.findByRole('button', { name: 'emit native recipe' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /保存本地快照/ })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: /保存本地快照/ }));

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('保存本地快照失败');
    });
  });
});
