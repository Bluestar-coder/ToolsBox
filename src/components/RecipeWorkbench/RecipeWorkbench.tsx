/**
 * Recipe工作台组件
 * 整合操作列表、Recipe编辑器和输入输出面板
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, Card, Input, Button, Space, Alert, Spin, Empty } from 'antd';
import { PlayCircleOutlined, BugOutlined, ClearOutlined, SaveOutlined } from '@ant-design/icons';
import type { Operation, OperationStep, Recipe, RecipeExecutionResult, DataTypeDetection } from '../../core/operations';
import { operationRegistry, recipeExecutor, dataTypeDetector } from '../../core/operations';
import OperationList from '../OperationList/OperationList';
import RecipeEditor from '../RecipeEditor/RecipeEditor';
import { useTranslation } from 'react-i18next';
import styles from './RecipeWorkbench.module.css';

const { Sider, Content } = Layout;
const { TextArea } = Input;

interface RecipeWorkbenchProps {
  /** 初始Recipe */
  initialRecipe?: Recipe;
  /** Recipe保存回调 */
  onSave?: (recipe: Recipe) => void;
  /** Recipe变更回调 */
  onRecipeChange?: (recipe: Recipe) => void;
}

/**
 * Recipe工作台组件
 */
const RecipeWorkbench: React.FC<RecipeWorkbenchProps> = ({
  initialRecipe,
  onSave,
  onRecipeChange,
}) => {
  const { t } = useTranslation();
  const defaultRecipeNameRef = useRef(t('recipeWorkbench.defaultRecipeName', '新建Recipe'));
  const createEmptyRecipe = useCallback((): Recipe => ({
    id: `recipe_${Date.now()}`,
    name: defaultRecipeNameRef.current,
    steps: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }), []);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe || createEmptyRecipe());
  const [inputData, setInputData] = useState('');
  const [executionResult, setExecutionResult] = useState<RecipeExecutionResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [dataTypes, setDataTypes] = useState<DataTypeDetection[]>([]);

  // 加载操作列表
  useEffect(() => {
    const syncOperations = () => {
      try {
        setOperations(operationRegistry.getAll());
      } catch (error) {
        console.error('加载操作失败:', error);
      } finally {
        setLoading(false);
      }
    };

    syncOperations();
    const unsubscribe = operationRegistry.subscribe(syncOperations);
    return unsubscribe;
  }, []);

  // 检测输入数据类型
  useEffect(() => {
    if (inputData) {
      const types = dataTypeDetector.detectDataTypes(inputData);
      setDataTypes(types);
    } else {
      setDataTypes([]);
    }
  }, [inputData]);

  // 同步父组件传入的初始Recipe（加载、导入、清空等场景）
  useEffect(() => {
    if (initialRecipe) {
      setRecipe(initialRecipe);
    } else {
      setRecipe(createEmptyRecipe());
    }
    setExecutionResult(null);
  }, [initialRecipe, createEmptyRecipe]);

  // 处理Recipe更新
  const handleRecipeChange = useCallback((newRecipe: Recipe) => {
    setRecipe(newRecipe);
    setExecutionResult(null); // 清除之前的执行结果
    onRecipeChange?.(newRecipe);
  }, [onRecipeChange]);

  // 从左侧操作列表快速添加步骤
  const handleAddOperationFromList = useCallback((operation: Operation) => {
    const newStep: OperationStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      operation,
      params: operation.getParameters().reduce((acc, param) => {
        acc[param.name] = param.defaultValue;
        return acc;
      }, {} as Record<string, unknown>),
      enabled: true,
    };

    const updatedRecipe = {
      ...recipe,
      steps: [...recipe.steps, newStep],
      updatedAt: new Date(),
    };
    setRecipe(updatedRecipe);
    onRecipeChange?.(updatedRecipe);
    setExecutionResult(null);
  }, [onRecipeChange, recipe]);

  // 执行Recipe
  const handleExecute = useCallback(async (execRecipe: Recipe) => {
    if (!inputData.trim()) {
      return;
    }

    setExecuting(true);
    setExecutionResult(null);

    try {
      const result = await recipeExecutor.executeRecipe(execRecipe, inputData);
      setExecutionResult(result);
    } catch (error) {
      console.error('执行Recipe失败:', error);
      setExecutionResult({
        isComplete: false,
        data: inputData,
        dataType: 'text',
        stepResults: [],
      });
    } finally {
      setExecuting(false);
    }
  }, [inputData]);

  // 调试Recipe
  const handleDebug = useCallback(async (
    execRecipe: Recipe,
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
      // 使用启用步骤的索引，避免禁用步骤导致的索引错位
      const enabledSteps = execRecipe.steps.filter(step => step.enabled);
      const stepIndex = stepId ? enabledSteps.findIndex(step => step.id === stepId) : 0;
      const safeStepIndex = stepIndex >= 0 ? stepIndex : 0;
      const result = await recipeExecutor.executeRecipe(
        execRecipe,
        executionInput,
        safeStepIndex,
        startDataType
      );
      setExecutionResult(result);
    } catch (error) {
      console.error('调试Recipe失败:', error);
      setExecutionResult({
        isComplete: false,
        data: executionInput,
        dataType: 'text',
        stepResults: [],
      });
    } finally {
      setExecuting(false);
    }
  }, [inputData]);

  // 清空输入
  const handleClearInput = useCallback(() => {
    setInputData('');
    setExecutionResult(null);
    setDataTypes([]);
  }, []);

  // 保存Recipe
  const handleSave = useCallback(() => {
    onSave?.(recipe);
  }, [recipe, onSave]);
  const hasEnabledSteps = recipe.steps.some(step => step.enabled);

  // 渲染数据类型检测提示
  const renderDataTypeHints = () => {
    if (dataTypes.length === 0) return null;

    const topTypes = dataTypes.slice(0, 3);
    
    return (
      <div className={styles.dataTypeHints}>
        <div className={styles.dataTypeHintsTitle}>
          {t('recipeWorkbench.detectedDataTypes', '检测到的数据类型')}:
        </div>
        <div className={styles.dataTypeHintsList}>
          {topTypes.map((type, index) => (
            <div key={index} className={styles.dataTypeHint}>
              <span className={styles.dataTypeName}>{type.type}</span>
              <span className={styles.dataTypeConfidence}>
                ({Math.round(type.confidence * 100)}%)
              </span>
              {type.suggestedOperations && (
                <div className={styles.suggestedOperations}>
                  {t('recipeWorkbench.suggestedOperations', '建议操作')}: {type.suggestedOperations.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染执行结果
  const renderExecutionResult = () => {
    if (!executionResult) return null;

    if (!executionResult.isComplete && !executionResult.isBreakpoint) {
      return (
        <Alert
          title={t('recipeWorkbench.executionFailed', '执行失败')}
          description={t('recipeWorkbench.executionFailedDesc', 'Recipe执行过程中发生错误，请检查步骤配置')}
          type="error"
          showIcon
          className={styles.executionAlert}
        />
      );
    }

    if (executionResult.isBreakpoint) {
      return (
        <Alert
          title={t('recipeWorkbench.breakpointHit', '断点触发')}
          description={t('recipeWorkbench.breakpointHitDesc', '在步骤 "{{stepName}}" 处停止', { 
            stepName: executionResult.nextStep?.operation.name 
          })}
          type="info"
          showIcon
          action={
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => {
                if (executionResult.nextStep) {
                  const enabledSteps = recipe.steps.filter(step => step.enabled);
                  const currentStepIndex = enabledSteps.findIndex(
                    step => step.id === executionResult.nextStep?.id
                  );
                  const nextStepId = currentStepIndex >= 0
                    ? enabledSteps[currentStepIndex + 1]?.id
                    : undefined;

                  if (nextStepId) {
                    void handleDebug(
                      recipe,
                      nextStepId,
                      executionResult.data,
                      executionResult.dataType
                    );
                    return;
                  }

                  setExecutionResult(previousResult => {
                    if (!previousResult) return previousResult;
                    return {
                      ...previousResult,
                      isBreakpoint: false,
                      isComplete: true,
                      nextStep: undefined,
                    };
                  });
                }
              }}
            >
              {t('recipeWorkbench.continueExecution', '继续执行')}
            </Button>
          }
          className={styles.executionAlert}
        />
      );
    }

    return (
      <div className={styles.executionResult}>
        <div className={styles.executionResultHeader}>
          <h4>{t('recipeWorkbench.executionResult', '执行结果')}</h4>
          <Space>
            <span className={styles.executionTime}>
              {t('recipeWorkbench.executionTime', '执行时间')}: {executionResult.totalExecutionTime}ms
            </span>
          </Space>
        </div>
        <div className={styles.executionSteps}>
          {executionResult.stepResults.map((result, index) => (
            <div
              key={index}
              className={`${styles.executionStep} ${result.success ? styles.stepSuccess : styles.stepError}`}
            >
              <div className={styles.stepHeader}>
                <span className={styles.stepName}>
                  {result.step.operation.name}
                </span>
                <span className={styles.stepTime}>
                  {result.executionTime}ms
                </span>
              </div>
              {!result.success && (
                <div className={styles.stepError}>
                  {t('recipeWorkbench.error', '错误')}: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout className={styles.recipeWorkbench}>
      <Sider width={300} className={styles.operationsSider}>
        <div className={styles.siderHeader}>
          <h3>{t('recipeWorkbench.operations', '操作列表')}</h3>
        </div>
        <div className={styles.siderContent}>
          <OperationList
            operations={operations}
            loading={loading}
            onOperationClick={handleAddOperationFromList}
          />
        </div>
      </Sider>
      
      <Layout className={styles.mainLayout}>
        <Content className={styles.mainContent}>
          <div className={styles.editorSection}>
            <RecipeEditor
              recipe={recipe}
              onRecipeChange={handleRecipeChange}
              onExecute={handleExecute}
              onDebug={handleDebug}
              operations={operations}
            />
          </div>
          
          <div className={styles.ioSection}>
            <div className={styles.inputSection}>
              <Card
                title={
                  <div className={styles.sectionTitle}>
                    <span>{t('recipeWorkbench.input', '输入')}</span>
                    <Space>
                      <Button
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        disabled={!onSave}
                      >
                        {t('recipeWorkbench.save', '保存')}
                      </Button>
                      <Button
                        icon={<ClearOutlined />}
                        onClick={handleClearInput}
                      >
                        {t('recipeWorkbench.clear', '清空')}
                      </Button>
                    </Space>
                  </div>
                }
                className={styles.ioCard}
              >
                <TextArea
                  placeholder={t('recipeWorkbench.inputPlaceholder', '请输入要处理的数据...')}
                  name="recipe-input-data"
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  rows={8}
                  className={styles.inputTextarea}
                />
                {renderDataTypeHints()}
              </Card>
            </div>
            
            <div className={styles.outputSection}>
              <Card
                title={
                  <div className={styles.sectionTitle}>
                    <span>{t('recipeWorkbench.output', '输出')}</span>
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleExecute(recipe)}
                        loading={executing}
                        disabled={!inputData.trim() || !hasEnabledSteps}
                      >
                        {t('recipeWorkbench.execute', '执行')}
                      </Button>
                      <Button
                        icon={<BugOutlined />}
                        onClick={() => {
                          const firstEnabledStep = recipe.steps.find(step => step.enabled);
                          void handleDebug(recipe, firstEnabledStep?.id);
                        }}
                        disabled={!inputData.trim() || !hasEnabledSteps}
                      >
                        {t('recipeWorkbench.debug', '调试')}
                      </Button>
                    </Space>
                  </div>
                }
                className={styles.ioCard}
              >
                {executing ? (
                  <div className={styles.loadingContainer}>
                    <Spin size="large" />
                    <div className={styles.loadingText}>
                      {t('recipeWorkbench.executing', '执行中...')}
                    </div>
                  </div>
                ) : executionResult ? (
                  <div className={styles.outputContent}>
                    <TextArea
                      value={executionResult.data}
                      readOnly
                      rows={8}
                      className={styles.outputTextarea}
                    />
                    {renderExecutionResult()}
                  </div>
                ) : (
                  <Empty
                    description={t('recipeWorkbench.noOutput', '暂无输出')}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default RecipeWorkbench;
