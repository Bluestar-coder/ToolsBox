import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Operation, OperationInput, Recipe } from '../../core/operations';
import RecipeWorkbench from './RecipeWorkbench';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string, options?: Record<string, string>) => {
      if (!defaultValue) {
        return _key;
      }
      return defaultValue.replace('{{stepName}}', options?.stepName ?? '');
    },
  }),
}));

vi.mock('../OperationList/OperationList', () => ({
  default: () => <div>OperationList</div>,
}));

vi.mock('../RecipeEditor/RecipeEditor', () => ({
  default: () => <div>RecipeEditor</div>,
}));

function createOperation(config: {
  id: string;
  name: string;
  execute: (input: OperationInput) => Promise<{ success: boolean; output: { data: string; dataType: string }; error?: string }>;
}): Operation {
  return {
    id: config.id,
    name: config.name,
    description: `${config.name} description`,
    category: 'encoding',
    inputType: 'text',
    outputType: 'text',
    getParameters: () => [],
    validateInput: () => ({ valid: true }),
    execute: (input: OperationInput) => config.execute(input),
  };
}

function createRecipe(steps: Recipe['steps']): Recipe {
  return {
    id: 'recipe-test',
    name: 'Recipe Test',
    steps,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('RecipeWorkbench', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders failed step and error detail when execution fails', async () => {
    const failingOperation = createOperation({
      id: 'fail_op',
      name: 'Fail Step',
      execute: async () => ({
        success: false,
        output: { data: '', dataType: 'text' },
        error: 'boom',
      }),
    });

    const recipe = createRecipe([
      {
        id: 'step-1',
        operation: failingOperation,
        params: {},
        enabled: true,
      },
    ]);

    render(<RecipeWorkbench initialRecipe={recipe} />);

    fireEvent.change(screen.getByPlaceholderText('请输入要处理的数据...'), {
      target: { value: 'payload' },
    });
    fireEvent.click(screen.getByRole('button', { name: /执行/ }));

    await waitFor(() => {
      expect(screen.getByText('执行失败')).toBeInTheDocument();
    });

    expect(screen.getByText((content) => content.includes('失败步骤') && content.includes('Fail Step'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('错误详情') && content.includes('boom'))).toBeInTheDocument();
  });

  it('shows an empty output state before execution starts', () => {
    const stepOne = createOperation({
      id: 'step_one',
      name: 'Step One',
      execute: async (input) => ({
        success: true,
        output: { data: `${input.data}-1`, dataType: 'text' },
      }),
    });
    const stepTwo = createOperation({
      id: 'step_two',
      name: 'Step Two',
      execute: async (input) => ({
        success: true,
        output: { data: `${input.data}-2`, dataType: 'text' },
      }),
    });

    const recipe = createRecipe([
      {
        id: 'step-1',
        operation: stepOne,
        params: {},
        enabled: true,
        isBreakpoint: true,
      },
      {
        id: 'step-2',
        operation: stepTwo,
        params: {},
        enabled: true,
      },
    ]);

    render(<RecipeWorkbench initialRecipe={recipe} />);

    expect(screen.getByText('暂无输出')).toBeInTheDocument();
  });
});
