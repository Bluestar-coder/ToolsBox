import { describe, expect, it } from 'vitest';
import type { Operation, OperationInput, Recipe } from '../../../core/operations';
import {
  deserializeRecipe,
  deserializeRecipes,
  serializeRecipe,
  serializeRecipes,
} from './recipe-serialization';

function createMockOperation(id: string, name: string): Operation {
  return {
    id,
    name,
    description: `${name} description`,
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
      executionTime: 0,
    }),
    validateInput: () => ({ valid: true }),
  };
}

describe('recipe serialization', () => {
  const base64Decode = createMockOperation('base64_decode', 'Base64 Decode');
  const urlDecode = createMockOperation('url_decode', 'URL Decode');
  const lookupOperation = (operationId: string): Operation | undefined => {
    if (operationId === base64Decode.id) return base64Decode;
    if (operationId === urlDecode.id) return urlDecode;
    return undefined;
  };

  it('serializes and deserializes a recipe', () => {
    const recipe: Recipe = {
      id: 'recipe-1',
      name: 'Demo Recipe',
      steps: [
        {
          id: 'step-1',
          operation: base64Decode,
          params: { charset: 'utf-8' },
          enabled: true,
        },
      ],
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
      updatedAt: new Date('2026-02-02T00:00:00.000Z'),
    };

    const serialized = serializeRecipe(recipe);
    expect(serialized.steps[0].operationId).toBe('base64_decode');

    const restored = deserializeRecipe(serialized, lookupOperation);
    expect(restored.id).toBe(recipe.id);
    expect(restored.name).toBe(recipe.name);
    expect(restored.steps).toHaveLength(1);
    expect(restored.steps[0].operation.id).toBe('base64_decode');
    expect(restored.steps[0].params).toEqual({ charset: 'utf-8' });
  });

  it('supports legacy step.operation.id payloads', () => {
    const legacyPayload = {
      id: 'legacy-recipe',
      name: 'Legacy',
      steps: [
        {
          id: 'legacy-step',
          operation: { id: 'url_decode' },
          params: { strict: true },
          enabled: true,
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const restored = deserializeRecipe(legacyPayload, lookupOperation);
    expect(restored.steps[0].operation.id).toBe('url_decode');
    expect(restored.steps[0].params).toEqual({ strict: true });
  });

  it('throws when operation id cannot be resolved', () => {
    const payload = {
      id: 'broken-recipe',
      name: 'Broken',
      steps: [
        {
          id: 'broken-step',
          operationId: 'missing_operation',
          params: {},
          enabled: true,
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    expect(() => deserializeRecipe(payload, lookupOperation)).toThrow('Unknown operation id');
  });

  it('serializes and deserializes recipes list', () => {
    const recipes: Recipe[] = [
      {
        id: 'recipe-1',
        name: 'Recipe 1',
        steps: [
          {
            id: 'step-1',
            operation: base64Decode,
            params: {},
            enabled: true,
          },
        ],
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
      {
        id: 'recipe-2',
        name: 'Recipe 2',
        steps: [
          {
            id: 'step-2',
            operation: urlDecode,
            params: {},
            enabled: true,
          },
        ],
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ];

    const serialized = serializeRecipes(recipes);
    const restored = deserializeRecipes(serialized, lookupOperation);

    expect(restored).toHaveLength(2);
    expect(restored[0].steps[0].operation.id).toBe('base64_decode');
    expect(restored[1].steps[0].operation.id).toBe('url_decode');
  });
});
