import { describe, expect, it } from 'vitest';
import { RecipeExecutor } from './executor';
import type { Operation, OperationInput, OperationResult, Recipe } from './types';

const createOperation = (config: {
  id: string;
  inputType: string;
  outputType: string;
}): Operation => ({
  id: config.id,
  name: config.id,
  description: `${config.id} operation`,
  category: 'encoding',
  inputType: config.inputType,
  outputType: config.outputType,
  getParameters: () => [],
  validateInput: () => ({ valid: true }),
  execute: async (input: OperationInput): Promise<OperationResult> => ({
    success: true,
    output: {
      data: input.data,
      dataType: config.outputType,
    },
  }),
});

const createRecipe = (operation: Operation): Recipe => ({
  id: 'recipe_test',
  name: 'test recipe',
  steps: [
    {
      id: 'step_1',
      operation,
      params: {},
      enabled: true,
    },
  ],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('RecipeExecutor.executeStep', () => {
  it('uses operation inputType when it is non-text and no explicit type is provided', async () => {
    const executor = new RecipeExecutor();
    const operation = createOperation({
      id: 'url_decode',
      inputType: 'url',
      outputType: 'text',
    });
    const recipe = createRecipe(operation);

    const result = await executor.executeStep(recipe, 'name=Jack%20Ma', 0);

    expect(result.success).toBe(true);
    expect(result.input.dataType).toBe('url');
  });

  it('infers high-confidence data type for text operations', async () => {
    const executor = new RecipeExecutor();
    const operation = createOperation({
      id: 'noop_text',
      inputType: 'text',
      outputType: 'text',
    });
    const recipe = createRecipe(operation);

    const result = await executor.executeStep(recipe, '{"name":"jack"}', 0);

    expect(result.success).toBe(true);
    expect(result.input.dataType).toBe('json');
  });

  it('prefers explicit input data type when provided', async () => {
    const executor = new RecipeExecutor();
    const operation = createOperation({
      id: 'base64_decode',
      inputType: 'base64',
      outputType: 'text',
    });
    const recipe = createRecipe(operation);

    const result = await executor.executeStep(recipe, 'dGVzdA==', 0, 'binary');

    expect(result.success).toBe(true);
    expect(result.input.dataType).toBe('binary');
  });
});

describe('RecipeExecutor.executeRecipe', () => {
  it('uses first executed step inputType for initial data type resolution', async () => {
    const executor = new RecipeExecutor();
    const operation = createOperation({
      id: 'url_decode',
      inputType: 'url',
      outputType: 'text',
    });
    const recipe = createRecipe(operation);

    const result = await executor.executeRecipe(recipe, 'name=Jack%20Ma');

    expect(result.isComplete).toBe(true);
    expect(result.stepResults[0].input.dataType).toBe('url');
  });

  it('respects explicit inputDataType in executeRecipe', async () => {
    const executor = new RecipeExecutor();
    const operation = createOperation({
      id: 'base64_decode',
      inputType: 'base64',
      outputType: 'text',
    });
    const recipe = createRecipe(operation);

    const result = await executor.executeRecipe(recipe, 'dGVzdA==', 0, 'binary');

    expect(result.isComplete).toBe(true);
    expect(result.stepResults[0].input.dataType).toBe('binary');
  });

  it('derives initial data type from startFrom step when resuming execution', async () => {
    const executor = new RecipeExecutor();
    const passthrough = createOperation({
      id: 'noop_text',
      inputType: 'text',
      outputType: 'text',
    });
    const urlDecode = createOperation({
      id: 'url_decode',
      inputType: 'url',
      outputType: 'text',
    });
    const recipe: Recipe = {
      id: 'recipe_resume',
      name: 'resume recipe',
      steps: [
        { id: 'step_1', operation: passthrough, params: {}, enabled: true },
        { id: 'step_2', operation: urlDecode, params: {}, enabled: true },
      ],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const result = await executor.executeRecipe(recipe, 'name=Jack%20Ma', 1);

    expect(result.isComplete).toBe(true);
    expect(result.stepResults).toHaveLength(1);
    expect(result.stepResults[0].step.id).toBe('step_2');
    expect(result.stepResults[0].input.dataType).toBe('url');
  });
});
