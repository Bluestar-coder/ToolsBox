import type { Operation, OperationStep, Recipe } from '../../../core/operations';

export const SERIALIZED_RECIPE_VERSION = 2;

export interface SerializedRecipeStep {
  id: string;
  operationId: string;
  params: Record<string, unknown>;
  enabled: boolean;
  isBreakpoint?: boolean;
}

export interface SerializedRecipe {
  version: number;
  id: string;
  name: string;
  description?: string;
  steps: SerializedRecipeStep[];
  createdAt: string;
  updatedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDate(value: unknown, fallback: Date): Date {
  if (typeof value !== 'string') {
    return fallback;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function resolveOperationId(step: Record<string, unknown>, stepIndex: number): string {
  if (typeof step.operationId === 'string' && step.operationId.trim()) {
    return step.operationId;
  }

  if (typeof step.operation === 'string' && step.operation.trim()) {
    return step.operation;
  }

  if (isRecord(step.operation) && typeof step.operation.id === 'string' && step.operation.id.trim()) {
    return step.operation.id;
  }

  throw new Error(`Step ${stepIndex + 1} is missing operation id`);
}

export function serializeRecipe(recipe: Recipe): SerializedRecipe {
  return {
    version: SERIALIZED_RECIPE_VERSION,
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    steps: recipe.steps.map(step => ({
      id: step.id,
      operationId: step.operation.id,
      params: step.params,
      enabled: step.enabled,
      isBreakpoint: step.isBreakpoint,
    })),
  };
}

export function serializeRecipes(recipes: Recipe[]): SerializedRecipe[] {
  return recipes.map(serializeRecipe);
}

function normalizeSerializedRecipe(payload: Record<string, unknown>): SerializedRecipe {
  const version = typeof payload.version === 'number' && Number.isFinite(payload.version)
    ? Math.trunc(payload.version)
    : 1;

  switch (version) {
    case 1:
    case SERIALIZED_RECIPE_VERSION:
      return {
        version: SERIALIZED_RECIPE_VERSION,
        id: typeof payload.id === 'string' ? payload.id : '',
        name: typeof payload.name === 'string' ? payload.name : '',
        description: typeof payload.description === 'string' ? payload.description : undefined,
        steps: Array.isArray(payload.steps)
          ? payload.steps.map((step) => step as SerializedRecipeStep)
          : [],
        createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : '',
        updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : '',
      };
    default:
      throw new Error(`Unsupported recipe version: ${version}`);
  }
}

export function deserializeRecipe(
  payload: unknown,
  lookupOperation: (operationId: string) => Operation | undefined
): Recipe {
  if (!isRecord(payload)) {
    throw new Error('Invalid recipe payload');
  }

  const normalizedPayload = normalizeSerializedRecipe(payload);
  const id = normalizedPayload.id;
  const name = normalizedPayload.name;
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('Invalid recipe id');
  }
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Invalid recipe name');
  }
  if (!Array.isArray(normalizedPayload.steps)) {
    throw new Error('Invalid recipe steps');
  }

  const now = new Date();
  const steps: OperationStep[] = normalizedPayload.steps.map((rawStep, index) => {
    if (!isRecord(rawStep)) {
      throw new Error(`Step ${index + 1} is invalid`);
    }

    const operationId = resolveOperationId(rawStep, index);
    const operation = lookupOperation(operationId);
    if (!operation) {
      throw new Error(`Unknown operation id: ${operationId}`);
    }

    return {
      id: typeof rawStep.id === 'string' && rawStep.id.trim()
        ? rawStep.id
        : `step_${Date.now()}_${index}`,
      operation,
      params: isRecord(rawStep.params) ? rawStep.params : {},
      enabled: rawStep.enabled !== false,
      isBreakpoint: rawStep.isBreakpoint === true,
    };
  });

  return {
    id,
    name,
    description: normalizedPayload.description,
    steps,
    createdAt: parseDate(normalizedPayload.createdAt, now),
    updatedAt: parseDate(normalizedPayload.updatedAt, now),
  };
}

export function deserializeRecipes(
  payload: unknown,
  lookupOperation: (operationId: string) => Operation | undefined
): Recipe[] {
  if (!Array.isArray(payload)) {
    throw new Error('Invalid recipes payload');
  }

  return payload.map(item => deserializeRecipe(item, lookupOperation));
}
