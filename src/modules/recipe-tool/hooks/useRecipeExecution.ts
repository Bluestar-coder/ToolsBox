import { useCallback, useEffect, useState } from 'react';
import { dataTypeDetector, recipeExecutor, type DataTypeDetection, type Recipe, type RecipeExecutionResult } from '../../../core/operations';

interface UseRecipeExecutionResult {
  inputData: string;
  setInputData: (value: string) => void;
  executionResult: RecipeExecutionResult | null;
  executing: boolean;
  dataTypes: DataTypeDetection[];
  clearInput: () => void;
  resetExecutionResult: () => void;
  executeRecipe: (recipe: Recipe) => Promise<void>;
  debugRecipe: (
    recipe: Recipe,
    stepId?: string,
    startData?: string,
    startDataType?: string
  ) => Promise<void>;
  continueExecution: (recipe: Recipe) => Promise<void>;
}

export function useRecipeExecution(): UseRecipeExecutionResult {
  const [inputData, setInputData] = useState('');
  const [executionResult, setExecutionResult] = useState<RecipeExecutionResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [dataTypes, setDataTypes] = useState<DataTypeDetection[]>([]);

  useEffect(() => {
    if (!inputData) {
      setDataTypes([]);
      return;
    }

    setDataTypes(dataTypeDetector.detectDataTypes(inputData));
  }, [inputData]);

  const resetExecutionResult = useCallback(() => {
    setExecutionResult(null);
  }, []);

  const clearInput = useCallback(() => {
    setInputData('');
    setExecutionResult(null);
    setDataTypes([]);
  }, []);

  const executeRecipe = useCallback(async (recipe: Recipe) => {
    if (!inputData.trim()) {
      return;
    }

    setExecuting(true);
    setExecutionResult(null);

    try {
      const result = await recipeExecutor.executeRecipe(recipe, inputData);
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        isComplete: false,
        error: error instanceof Error ? error.message : String(error),
        data: inputData,
        dataType: 'text',
        stepResults: [],
      });
    } finally {
      setExecuting(false);
    }
  }, [inputData]);

  const debugRecipe = useCallback(async (
    recipe: Recipe,
    stepId?: string,
    startData?: string,
    startDataType?: string
  ) => {
    const executionInput = startData ?? inputData;
    if (!executionInput.trim()) {
      return;
    }

    setExecuting(true);
    setExecutionResult(null);

    try {
      const enabledSteps = recipe.steps.filter((step) => step.enabled);
      const stepIndex = stepId ? enabledSteps.findIndex((step) => step.id === stepId) : 0;
      const safeStepIndex = stepIndex >= 0 ? stepIndex : 0;
      const result = await recipeExecutor.executeRecipe(
        recipe,
        executionInput,
        safeStepIndex,
        startDataType
      );
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        isComplete: false,
        error: error instanceof Error ? error.message : String(error),
        data: executionInput,
        dataType: startDataType ?? 'text',
        stepResults: [],
      });
    } finally {
      setExecuting(false);
    }
  }, [inputData]);

  const continueExecution = useCallback(async (recipe: Recipe) => {
    if (!executionResult?.isBreakpoint || !executionResult.nextStep) {
      return;
    }

    setExecuting(true);

    try {
      const enabledSteps = recipe.steps.filter((step) => step.enabled);
      const currentStepIndex = enabledSteps.findIndex((step) => step.id === executionResult.nextStep?.id);

      if (currentStepIndex < 0) {
        setExecutionResult((previous) => previous ? {
          ...previous,
          isBreakpoint: false,
          isComplete: true,
          nextStep: undefined,
        } : previous);
        return;
      }

      const resumed = await recipeExecutor.executeRecipe(
        recipe,
        executionResult.data,
        currentStepIndex,
        executionResult.dataType,
        true
      );

      setExecutionResult({
        ...resumed,
        stepResults: [...executionResult.stepResults, ...resumed.stepResults],
        totalExecutionTime: (executionResult.totalExecutionTime ?? 0) + (resumed.totalExecutionTime ?? 0),
      });
    } catch (error) {
      setExecutionResult((previous) => previous ? {
        ...previous,
        isBreakpoint: false,
        error: error instanceof Error ? error.message : String(error),
      } : previous);
    } finally {
      setExecuting(false);
    }
  }, [executionResult]);

  return {
    inputData,
    setInputData,
    executionResult,
    executing,
    dataTypes,
    clearInput,
    resetExecutionResult,
    executeRecipe,
    debugRecipe,
    continueExecution,
  };
}
