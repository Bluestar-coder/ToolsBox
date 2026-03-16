import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  DataTypeDetection,
  Operation,
  OperationInput,
  Recipe,
  RecipeExecutionResult,
} from '../../core/operations';
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

const workbenchMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  subscribe: vi.fn(),
  inputData: '',
  setInputData: vi.fn(),
  executionResult: null as RecipeExecutionResult | null,
  executing: false,
  dataTypes: [] as DataTypeDetection[],
  clearInput: vi.fn(),
  resetExecutionResult: vi.fn(),
  executeRecipe: vi.fn(),
  debugRecipe: vi.fn(),
  continueExecution: vi.fn(),
  editorChange: null as Recipe | null,
}));

vi.mock('../../core/operations', () => ({
  operationRegistry: {
    getAll: workbenchMocks.getAll,
    subscribe: workbenchMocks.subscribe,
  },
}));

vi.mock('../../modules/recipe-tool/hooks/useRecipeExecution', () => ({
  useRecipeExecution: () => ({
    inputData: workbenchMocks.inputData,
    setInputData: workbenchMocks.setInputData,
    executionResult: workbenchMocks.executionResult,
    executing: workbenchMocks.executing,
    dataTypes: workbenchMocks.dataTypes,
    clearInput: workbenchMocks.clearInput,
    resetExecutionResult: workbenchMocks.resetExecutionResult,
    executeRecipe: workbenchMocks.executeRecipe,
    debugRecipe: workbenchMocks.debugRecipe,
    continueExecution: workbenchMocks.continueExecution,
  }),
}));

vi.mock('../OperationList/OperationList', () => ({
  default: ({
    operations,
    loading,
    onOperationClick,
  }: {
    operations: Operation[];
    loading: boolean;
    onOperationClick: (operation: Operation) => void;
  }) => (
    <div>
      <div>{loading ? 'operation-list-loading' : 'operation-list-ready'}</div>
      {operations.map((operation) => (
        <button key={operation.id} type="button" onClick={() => onOperationClick(operation)}>
          add-{operation.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../RecipeEditor/RecipeEditor', () => ({
  default: ({
    recipe,
    onRecipeChange,
  }: {
    recipe: Recipe;
    onRecipeChange: (recipe: Recipe) => void;
  }) => (
    <div>
      <div>editor-recipe-name:{recipe.name}</div>
      <div>editor-step-count:{recipe.steps.length}</div>
      <button
        type="button"
        onClick={() => {
          if (workbenchMocks.editorChange) {
            onRecipeChange(workbenchMocks.editorChange);
          }
        }}
      >
        editor-change
      </button>
    </div>
  ),
}));

function createOperation(id: string, name: string): Operation {
  return {
    id,
    name,
    description: `${name} description`,
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

function createRecipe(name = 'Recipe Mock', operation = createOperation('base64_decode', 'Base64 Decode')): Recipe {
  return {
    id: 'recipe-mock',
    name,
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

describe('RecipeWorkbench behavior', () => {
  beforeEach(() => {
    workbenchMocks.getAll.mockReset();
    workbenchMocks.subscribe.mockReset();
    workbenchMocks.setInputData.mockReset();
    workbenchMocks.clearInput.mockReset();
    workbenchMocks.resetExecutionResult.mockReset();
    workbenchMocks.executeRecipe.mockReset();
    workbenchMocks.debugRecipe.mockReset();
    workbenchMocks.continueExecution.mockReset();
    workbenchMocks.getAll.mockReturnValue([createOperation('url_encode', 'URL Encode')]);
    workbenchMocks.subscribe.mockReturnValue(vi.fn());
    workbenchMocks.inputData = '';
    workbenchMocks.executionResult = null;
    workbenchMocks.executing = false;
    workbenchMocks.dataTypes = [];
    workbenchMocks.editorChange = null;
  });

  it('adds steps from the operation list, handles editor changes, and wires save/clear/input actions', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onRecipeChange = vi.fn();
    const listedOperation = createOperation('url_encode', 'URL Encode');
    const updatedRecipe = createRecipe('Edited Recipe', listedOperation);
    workbenchMocks.inputData = 'payload';
    workbenchMocks.getAll.mockReturnValue([listedOperation]);
    workbenchMocks.editorChange = updatedRecipe;

    render(<RecipeWorkbench onSave={onSave} onRecipeChange={onRecipeChange} />);

    expect(screen.getByText('operation-list-ready')).toBeInTheDocument();
    expect(screen.getByText('editor-recipe-name:新建Recipe')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('请输入要处理的数据...'), ' next');
    expect(workbenchMocks.setInputData).toHaveBeenCalled();

    await user.click(screen.getByText('add-URL Encode'));
    await waitFor(() => {
      expect(screen.getByText('editor-step-count:1')).toBeInTheDocument();
    });
    expect(onRecipeChange).toHaveBeenCalledWith(expect.objectContaining({
      steps: [expect.objectContaining({ operation: listedOperation })],
    }));
    expect(workbenchMocks.resetExecutionResult).toHaveBeenCalled();

    await user.click(screen.getByText('editor-change'));
    expect(onRecipeChange).toHaveBeenLastCalledWith(updatedRecipe);
    expect(screen.getByText('editor-recipe-name:Edited Recipe')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /保存/ }));
    expect(onSave).toHaveBeenCalledWith(updatedRecipe);

    await user.click(screen.getByRole('button', { name: /清空/ }));
    expect(workbenchMocks.clearInput).toHaveBeenCalled();

    await user.click(screen.getAllByRole('button', { name: /执行/ })[0]);
    expect(workbenchMocks.executeRecipe).toHaveBeenCalledWith(updatedRecipe);

    await user.click(screen.getAllByRole('button', { name: /调试/ })[0]);
    expect(workbenchMocks.debugRecipe).toHaveBeenCalledWith(updatedRecipe, 'step-1');
  });

  it('renders data type hints and completed execution results', () => {
    const recipe = createRecipe();
    workbenchMocks.inputData = 'payload';
    workbenchMocks.dataTypes = [
      { type: 'base64', confidence: 0.95, suggestedOperations: ['decode', 'analyze'] },
      { type: 'json', confidence: 0.72 },
      { type: 'jwt', confidence: 0.61, suggestedOperations: ['decode-jwt'] },
      { type: 'hex', confidence: 0.4 },
    ];
    workbenchMocks.executionResult = {
      isComplete: true,
      data: 'final-output',
      dataType: 'text',
      totalExecutionTime: 42,
      stepResults: [
        {
          step: recipe.steps[0],
          input: { data: 'payload', dataType: 'text' },
          output: { data: 'decoded', dataType: 'text' },
          success: true,
          executionTime: 12,
        },
        {
          step: {
            ...recipe.steps[0],
            id: 'step-2',
            operation: createOperation('url_encode', 'URL Encode'),
          },
          input: { data: 'decoded', dataType: 'text' },
          success: false,
          error: 'step boom',
          executionTime: 30,
        },
      ],
    };

    render(<RecipeWorkbench initialRecipe={recipe} />);

    expect(screen.getByText('检测到的数据类型:')).toBeInTheDocument();
    expect(screen.getByText('base64')).toBeInTheDocument();
    expect(screen.getByText('json')).toBeInTheDocument();
    expect(screen.getByText('jwt')).toBeInTheDocument();
    expect(screen.queryByText('hex')).not.toBeInTheDocument();
    expect(screen.getByText(/建议操作: decode, analyze/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('final-output')).toBeInTheDocument();
    expect(screen.getByText('执行时间: 42ms')).toBeInTheDocument();
    expect(screen.getByText('Base64 Decode')).toBeInTheDocument();
    expect(screen.getByText('URL Encode')).toBeInTheDocument();
    expect(screen.getByText('错误: step boom')).toBeInTheDocument();
  });

  it('renders breakpoint and loading states, disables actions when input is missing, and cleans up subscriptions', async () => {
    const user = userEvent.setup();
    const recipe = createRecipe();
    const unsubscribe = vi.fn();
    workbenchMocks.subscribe.mockReturnValue(unsubscribe);
    workbenchMocks.inputData = '';
    workbenchMocks.executing = true;
    workbenchMocks.executionResult = {
      isComplete: false,
      isBreakpoint: true,
      data: 'paused-output',
      dataType: 'text',
      nextStep: recipe.steps[0],
      stepResults: [],
    };

    const { unmount, rerender } = render(<RecipeWorkbench initialRecipe={recipe} />);

    expect(screen.getAllByRole('button', { name: /执行/ })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: /调试/ })[0]).toBeDisabled();
    expect(screen.getByText('执行中...')).toBeInTheDocument();

    workbenchMocks.executing = false;
    rerender(<RecipeWorkbench initialRecipe={recipe} />);
    expect(screen.getByText('断点触发')).toBeInTheDocument();
    expect(screen.getByText('在步骤 "Base64 Decode" 处停止')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /继续执行/ }));
    expect(workbenchMocks.continueExecution).toHaveBeenCalledWith(recipe);

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
