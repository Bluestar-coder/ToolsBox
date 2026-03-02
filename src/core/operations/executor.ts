/**
 * Recipe执行引擎
 * 负责执行操作链（Recipe）
 */

import type { 
  Recipe, 
  OperationInput, 
  RecipeExecutionResult, 
  StepResult 
} from './types';
import { dataTypeDetector } from './detector';

/**
 * Recipe执行器类
 */
export class RecipeExecutor {
  /**
   * 执行Recipe
   * @param recipe 要执行的Recipe
   * @param inputData 输入数据
   * @param startFrom 起始步骤索引（默认为0）
   * @param inputDataType 输入数据类型（可选）
   * @returns 执行结果
   */
  async executeRecipe(
    recipe: Recipe, 
    inputData: string, 
    startFrom = 0,
    inputDataType?: string
  ): Promise<RecipeExecutionResult> {
    const startTime = Date.now();
    let currentData: string = inputData;
    let currentDataType: string = 'text';
    const stepResults: StepResult[] = [];

    // 获取启用的步骤
    const enabledSteps = recipe.steps.filter(step => step.enabled);
    const safeStartFrom = Number.isFinite(startFrom)
      ? Math.max(0, Math.trunc(startFrom))
      : 0;
    
    // 如果起始索引超出范围，直接返回完成状态
    if (safeStartFrom >= enabledSteps.length) {
      return {
        isComplete: true,
        data: currentData,
        dataType: currentDataType,
        stepResults,
        totalExecutionTime: Date.now() - startTime,
      };
    }

    const initialStep = enabledSteps[safeStartFrom];
    currentDataType = this.resolveInputDataType(
      currentData,
      initialStep?.operation.inputType,
      inputDataType
    );

    // 执行步骤
    for (let i = safeStartFrom; i < enabledSteps.length; i++) {
      const step = enabledSteps[i];
      
      // 创建输入对象
      const input: OperationInput = {
        data: currentData,
        dataType: currentDataType,
      };

      try {
        // 检查是否是断点
        if (step.isBreakpoint) {
          return {
            isComplete: false,
            isBreakpoint: true,
            data: currentData,
            dataType: currentDataType,
            stepResults,
            nextStep: step,
            totalExecutionTime: Date.now() - startTime,
          };
        }

        // 执行操作
        const result = await step.operation.execute(input, step.params);
        
        // 创建步骤结果
        const stepResult: StepResult = {
          step,
          input,
          output: result.success ? result.output : undefined,
          success: result.success,
          error: result.error,
          executionTime: result.executionTime,
        };
        
        stepResults.push(stepResult);
        
        // 如果执行成功，更新当前数据
        if (result.success) {
          currentData = result.output.data;
          currentDataType = result.output.dataType;
        } else {
          // 如果执行失败，停止执行
          return {
            isComplete: false,
            data: currentData,
            dataType: currentDataType,
            stepResults,
            totalExecutionTime: Date.now() - startTime,
          };
        }
      } catch (error) {
        // 处理异常
        const stepResult: StepResult = {
          step,
          input,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
        
        stepResults.push(stepResult);
        
        return {
          isComplete: false,
          data: currentData,
          dataType: currentDataType,
          stepResults,
          totalExecutionTime: Date.now() - startTime,
        };
      }
    }

    // 所有步骤执行完成
    return {
      isComplete: true,
      data: currentData,
      dataType: currentDataType,
      stepResults,
      totalExecutionTime: Date.now() - startTime,
    };
  }

  /**
   * 单步执行Recipe
   * @param recipe Recipe
   * @param inputData 输入数据
   * @param stepIndex 要执行的步骤索引
   * @param inputDataType 输入数据类型（可选）
   * @returns 执行结果
   */
  async executeStep(
    recipe: Recipe,
    inputData: string,
    stepIndex: number,
    inputDataType?: string
  ): Promise<StepResult> {
    const enabledSteps = recipe.steps.filter(step => step.enabled);
    
    if (stepIndex >= enabledSteps.length) {
      throw new Error(`步骤索引 ${stepIndex} 超出范围`);
    }

    const step = enabledSteps[stepIndex];
    const input: OperationInput = {
      data: inputData,
      dataType: this.resolveInputDataType(inputData, step.operation.inputType, inputDataType),
    };

    try {
      const result = await step.operation.execute(input, step.params);
      
      return {
        step,
        input,
        output: result.success ? result.output : undefined,
        success: result.success,
        error: result.error,
        executionTime: result.executionTime,
      };
    } catch (error) {
      return {
        step,
        input,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private resolveInputDataType(data: string, expectedType?: string, explicitType?: string): string {
    if (typeof explicitType === 'string' && explicitType.trim() !== '') {
      return explicitType;
    }

    const detections = dataTypeDetector.detectDataTypes(data);
    const normalizedExpectedType = typeof expectedType === 'string' ? expectedType.trim() : '';

    if (normalizedExpectedType) {
      const matchedExpectedType = detections.find(
        detection => detection.type === normalizedExpectedType && detection.confidence >= 0.5
      );
      if (matchedExpectedType) {
        return normalizedExpectedType;
      }
    }

    const highConfidenceDetection = detections.find(detection => detection.confidence >= 0.85);
    if (highConfidenceDetection) {
      return highConfidenceDetection.type;
    }

    if (normalizedExpectedType) {
      return normalizedExpectedType;
    }

    return 'text';
  }

  /**
   * 验证Recipe
   * @param recipe 要验证的Recipe
   * @returns 验证结果
   */
  validateRecipe(recipe: Recipe): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查是否有步骤
    if (recipe.steps.length === 0) {
      errors.push('Recipe必须包含至少一个步骤');
    }

    // 检查是否有启用的步骤
    const enabledSteps = recipe.steps.filter(step => step.enabled);
    if (enabledSteps.length === 0) {
      errors.push('Recipe必须包含至少一个启用的步骤');
    }

    // 检查每个步骤
    for (const step of recipe.steps) {
      // 检查操作是否存在
      if (!step.operation) {
        errors.push(`步骤 ${step.id} 缺少操作定义`);
        continue;
      }

      // 检查参数
      const parameters = step.operation.getParameters();
      for (const param of parameters) {
        if (param.required && !(param.name in step.params)) {
          errors.push(`步骤 ${step.id} 缺少必需参数: ${param.name}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// 创建全局Recipe执行器实例
export const recipeExecutor = new RecipeExecutor();
