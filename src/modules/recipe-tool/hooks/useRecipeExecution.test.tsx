import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Operation, OperationInput, Recipe } from '../../../core/operations';
import { useRecipeExecution } from './useRecipeExecution';

function createOperation(config: {
  id: string;
  name: string;
  transform: (value: string) => string;
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
    execute: async (input: OperationInput) => ({
      success: true,
      output: {
        data: config.transform(input.data),
        dataType: 'text',
      },
    }),
  };
}

function createRecipe(): Recipe {
  const stepOne = createOperation({
    id: 'step_one',
    name: 'Step One',
    transform: (value) => `${value}-1`,
  });
  const stepTwo = createOperation({
    id: 'step_two',
    name: 'Step Two',
    transform: (value) => `${value}-2`,
  });

  return {
    id: 'recipe-hook',
    name: 'Hook Recipe',
    steps: [
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
    ],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('useRecipeExecution', () => {
  it('continues from the breakpoint step without skipping it', async () => {
    const recipe = createRecipe();
    const { result } = renderHook(() => useRecipeExecution());

    act(() => {
      result.current.setInputData('seed');
    });

    await act(async () => {
      await result.current.debugRecipe(recipe, 'step-1');
    });

    expect(result.current.executionResult?.isBreakpoint).toBe(true);
    expect(result.current.executionResult?.nextStep?.id).toBe('step-1');

    await act(async () => {
      await result.current.continueExecution(recipe);
    });

    await waitFor(() => {
      expect(result.current.executionResult?.isComplete).toBe(true);
    });

    expect(result.current.executionResult?.data).toBe('seed-1-2');
    expect(result.current.executionResult?.stepResults).toHaveLength(2);
    expect(result.current.executionResult?.stepResults[0].step.id).toBe('step-1');
    expect(result.current.executionResult?.stepResults[1].step.id).toBe('step-2');
  });
});
